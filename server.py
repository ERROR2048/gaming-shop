import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import pyodbc

HOST = '0.0.0.0'
PORT = int(os.environ.get('API_PORT', '8000'))
DB_DRIVER = os.environ.get('DB_DRIVER', 'ODBC Driver 18 for SQL Server')
DB_SERVER = os.environ.get('DB_SERVER', r'localhost\SQLEXPRESS')
DB_NAME = os.environ.get('DB_NAME', 'GameCareDB')
DB_USER = os.environ.get('DB_USER', '')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_CONNECTION_STRING = os.environ.get('DB_CONNECTION_STRING', '')
TOKEN_SECRET = os.environ.get('TOKEN_SECRET', 'учебный-секрет-поменять-для-продакшена').encode('utf-8')
TOKEN_LIFETIME = 12 * 60 * 60
SEED_CATEGORIES = ['Компьютеры', 'Периферия', 'Сеть и ПО']
SEED_SERVICES = [
    ('Диагностика игрового ПК', 'Проверка комплектующих, температур и стабильности системы.', 45, 1500, 'Компьютеры', 20),
    ('Сборка игрового компьютера', 'Сборка компонентов, кабель-менеджмент и первичная проверка.', 180, 6500, 'Компьютеры', 0),
    ('Чистка системы охлаждения', 'Удаление пыли и замена термопасты процессора.', 90, 3200, 'Компьютеры', 0),
    ('Установка системы и драйверов', 'Установка ОС, драйверов и базовых игровых программ.', 120, 4000, 'Компьютеры', 0),
    ('Ремонт игрового контроллера', 'Диагностика стиков, кнопок и разъёмов геймпада.', 60, 2800, 'Периферия', 20),
    ('Настройка игровой клавиатуры', 'Настройка раскладки, макросов и подсветки.', 40, 1700, 'Периферия', 0),
    ('Настройка игровой гарнитуры', 'Проверка микрофона, звука и пространственного аудио.', 35, 1400, 'Периферия', 0),
    ('Настройка домашней сети', 'Оптимизация Wi-Fi и проводного подключения для игр.', 60, 2500, 'Сеть и ПО', 0),
    ('Настройка игрового ПО', 'Оптимизация параметров игр, лаунчеров и графики.', 50, 2200, 'Сеть и ПО', 20),
    ('Консультация по апгрейду ПК', 'Подбор совместимых компонентов для обновления компьютера.', 30, 1000, 'Сеть и ПО', 0),
]


def b64url(data):
    return base64.urlsafe_b64encode(data).decode('ascii').rstrip('=')


def password_hash(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${b64url(salt)}${b64url(digest)}"


def verify_password(password, encoded):
    try:
        algorithm, salt_text, expected = encoded.split('$')
        if algorithm != 'scrypt':
            return False
        salt = base64.urlsafe_b64decode(salt_text + '=' * (-len(salt_text) % 4))
        actual = password_hash(password, salt).split('$')[2]
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def make_token(user):
    payload = {'uid': user['id'], 'role': user['role'], 'exp': int(datetime.now(timezone.utc).timestamp()) + TOKEN_LIFETIME}
    body = b64url(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signature = b64url(hmac.new(TOKEN_SECRET, body.encode('ascii'), hashlib.sha256).digest())
    return f'{body}.{signature}'


def decode_token(token):
    try:
        body, signature = token.split('.', 1)
        expected = b64url(hmac.new(TOKEN_SECRET, body.encode('ascii'), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            return None
        raw = base64.urlsafe_b64decode(body + '=' * (-len(body) % 4))
        payload = json.loads(raw)
        if payload.get('exp', 0) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return payload
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


def connection_string():
    if DB_CONNECTION_STRING:
        return DB_CONNECTION_STRING
    parts = [f'DRIVER={{{DB_DRIVER}}}', f'SERVER={DB_SERVER}', f'DATABASE={DB_NAME}', 'Encrypt=yes', 'TrustServerCertificate=yes']
    if DB_USER:
        parts.extend([f'UID={DB_USER}', f'PWD={DB_PASSWORD}'])
    else:
        parts.append('Trusted_Connection=yes')
    return ';'.join(parts) + ';'


class DictCursor:
    def __init__(self, cursor):
        self.cursor = cursor

    @property
    def rowcount(self):
        return self.cursor.rowcount

    def _dict(self, row):
        if row is None:
            return None
        names = [column[0] for column in self.cursor.description]
        return dict(zip(names, row))

    def fetchone(self):
        return self._dict(self.cursor.fetchone())

    def fetchall(self):
        return [self._dict(row) for row in self.cursor.fetchall()]


class DatabaseSession:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, params=()):
        cursor = self.connection.cursor()
        cursor.execute(sql, *params)
        return DictCursor(cursor)


@contextmanager
def db_session():
    connection = pyodbc.connect(connection_string(), timeout=8, autocommit=False)
    session = DatabaseSession(connection)
    try:
        yield session
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def initialize_seed_data():
    with db_session() as con:
        for name, description in [('admin', 'Администратор сервиса'), ('customer', 'Пользователь сервиса')]:
            if not con.execute('SELECT id FROM dbo.Roles WHERE name = ?', (name,)).fetchone():
                con.execute('INSERT INTO dbo.Roles(name, description) VALUES(?, ?)', (name, description))
        role_ids = {row['name']: row['id'] for row in con.execute('SELECT id, name FROM dbo.Roles').fetchall()}
        for name in SEED_CATEGORIES:
            if not con.execute('SELECT id FROM dbo.Categories WHERE name = ?', (name,)).fetchone():
                con.execute('INSERT INTO dbo.Categories(name) VALUES(?)', (name,))
        categories = {row['name']: row['id'] for row in con.execute('SELECT id, name FROM dbo.Categories').fetchall()}
        for name, description, duration, price, category, discount in SEED_SERVICES:
            if not con.execute('SELECT id FROM dbo.Services WHERE name = ?', (name,)).fetchone():
                con.execute('''INSERT INTO dbo.Services(name, description, duration_minutes, price, category_id, discount_percent)
                               VALUES(?, ?, ?, ?, ?, ?)''', (name, description, duration, price, categories[category], discount))
        accounts = [
            ('admin@service.local', 'Администратор', 'Admin123!', role_ids['admin']),
            ('user@student.ru', 'Демо-пользователь', 'User1234!', role_ids['customer']),
        ]
        for email, full_name, password, role_id in accounts:
            if not con.execute('SELECT id FROM dbo.Users WHERE email = ?', (email,)).fetchone():
                con.execute('''INSERT INTO dbo.Users(email, full_name, password_hash, role_id)
                               VALUES(?, ?, ?, ?)''', (email, full_name, password_hash(password), role_id))
        demo_user = con.execute('SELECT id FROM dbo.Users WHERE email = ?', ('user@student.ru',)).fetchone()
        admin = con.execute('SELECT id FROM dbo.Users WHERE email = ?', ('admin@service.local',)).fetchone()
        if not con.execute('SELECT id FROM dbo.Coupons WHERE assigned_user_id = ?', (demo_user['id'],)).fetchone():
            con.execute('''INSERT INTO dbo.Coupons(code, discount_percent, assigned_user_id, kind, created_by)
                           VALUES(N'WELCOME10', 10, ?, N'personal', ?)''', (demo_user['id'], admin['id']))


def row_to_user(row):
    if not row:
        return None
    return {
        'id': row['id'],
        'email': row['email'],
        'name': row['full_name'],
        'role': row['role'],
        'coupon': {'code': row['coupon_code'], 'discount_percent': row['coupon_percent']} if row.get('coupon_code') else None,
    }


def public_service(row):
    base = dict(row)
    base['price'] = int(base['price'])
    base['final_price'] = (base['price'] * (100 - int(base['discount_percent'])) + 50) // 100
    return base


def json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


class ApiHandler(BaseHTTPRequestHandler):
    server_version = 'ServiceStoreAPI/2.0'

    def log_message(self, fmt, *args):
        print(f'[{self.log_date_time_string()}] {self.address_string()} {fmt % args}')

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False, default=json_default).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(200, {'ok': True})

    def read_json(self):
        size = int(self.headers.get('Content-Length', '0'))
        if size > 1_000_000:
            raise ValueError('Слишком большой запрос')
        return json.loads(self.rfile.read(size).decode('utf-8')) if size else {}

    def current_user(self, required=True, admin=False):
        header = self.headers.get('Authorization', '')
        token = header.removeprefix('Bearer ').strip() if header.startswith('Bearer ') else ''
        payload = decode_token(token) if token else None
        if not payload:
            if required:
                self.send_json(401, {'error': 'Войдите в аккаунт, чтобы выполнить это действие.'})
            return None
        with db_session() as con:
            row = con.execute('''SELECT u.id, u.email, u.full_name, r.name AS role,
                c.code AS coupon_code, c.discount_percent AS coupon_percent
                FROM dbo.Users u JOIN dbo.Roles r ON r.id=u.role_id
                LEFT JOIN dbo.Coupons c ON c.assigned_user_id=u.id AND c.active=1
                WHERE u.id=? AND u.active=1''', (payload['uid'],)).fetchone()
        user = row_to_user(row)
        if not user:
            if required:
                self.send_json(401, {'error': 'Пользователь не найден или отключён.'})
            return None
        if admin and user['role'] != 'admin':
            self.send_json(403, {'error': 'Действие доступно только администратору.'})
            return None
        return user

    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path == '/api/health':
                with db_session() as con:
                    con.execute('SELECT 1 AS ok').fetchone()
                return self.send_json(200, {'ok': True, 'database': DB_NAME, 'engine': 'Microsoft SQL Server'})
            if path == '/api/admin/services':
                admin = self.current_user(admin=True)
                if admin is None:
                    return
                with db_session() as con:
                    rows = con.execute('''SELECT s.id, s.name, s.description, s.duration_minutes,
                        s.price, s.discount_percent, s.active, s.category_id, c.name AS category
                        FROM dbo.Services s JOIN dbo.Categories c ON c.id=s.category_id
                        ORDER BY s.active DESC, c.name, s.name''').fetchall()
                return self.send_json(200, {'services': [public_service(row) for row in rows]})
            if path == '/api/admin/appointments':
                admin = self.current_user(admin=True)
                if admin is None:
                    return
                with db_session() as con:
                    rows = con.execute('''SELECT a.id, a.quantity, a.appointment_datetime, a.status,
                        u.full_name, u.email, s.name AS service_name, p.amount, p.status AS payment_status
                        FROM dbo.Appointments a JOIN dbo.Users u ON u.id=a.user_id
                        JOIN dbo.Services s ON s.id=a.service_id
                        LEFT JOIN dbo.Payments p ON p.appointment_id=a.id
                        ORDER BY a.created_at DESC, a.id DESC''').fetchall()
                return self.send_json(200, {'appointments': rows})
            if path == '/api/services':
                with db_session() as con:
                    rows = con.execute('''SELECT s.id, s.name, s.description, s.duration_minutes,
                        s.price, s.discount_percent, c.name AS category
                        FROM dbo.Services s JOIN dbo.Categories c ON c.id=s.category_id
                        WHERE s.active=1 ORDER BY c.name, s.name''').fetchall()
                return self.send_json(200, {'services': [public_service(row) for row in rows]})
            if path == '/api/categories':
                with db_session() as con:
                    rows = con.execute('SELECT id, name FROM dbo.Categories ORDER BY name').fetchall()
                return self.send_json(200, {'categories': rows})
            if path == '/api/auth/me':
                user = self.current_user()
                if user is None:
                    return
                return self.send_json(200, {'user': user})
            if path == '/api/appointments':
                user = self.current_user()
                if user is None:
                    return
                with db_session() as con:
                    rows = con.execute('''SELECT a.id, a.quantity, a.appointment_datetime, a.status,
                        s.name AS service_name, p.amount, p.status AS payment_status
                        FROM dbo.Appointments a JOIN dbo.Services s ON s.id=a.service_id
                        LEFT JOIN dbo.Payments p ON p.appointment_id=a.id
                        WHERE a.user_id=? ORDER BY a.created_at DESC, a.id DESC''', (user['id'],)).fetchall()
                return self.send_json(200, {'appointments': rows})
            if path == '/api/admin/users':
                admin = self.current_user(admin=True)
                if admin is None:
                    return
                with db_session() as con:
                    rows = con.execute('''SELECT u.id, u.email, u.full_name, r.name AS role,
                        c.code AS coupon_code, c.discount_percent AS coupon_percent
                        FROM dbo.Users u JOIN dbo.Roles r ON r.id=u.role_id
                        LEFT JOIN dbo.Coupons c ON c.assigned_user_id=u.id AND c.active=1
                        ORDER BY u.id''').fetchall()
                return self.send_json(200, {'users': rows})
            return self.send_json(404, {'error': 'Маршрут API не найден.'})
        except Exception as exc:
            return self.send_json(500, {'error': f'Ошибка API или соединения с MS SQL Server: {exc}'})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
            if path == '/api/auth/register':
                email = str(data.get('email', '')).strip().lower()
                password = str(data.get('password', ''))
                full_name = str(data.get('full_name', '')).strip() or email.split('@')[0]
                if not email or '@' not in email or not password:
                    return self.send_json(400, {'error': 'Заполните корректный e-mail и пароль.'})
                if len(password) < 8:
                    return self.send_json(400, {'error': 'Пароль должен содержать не менее 8 символов.'})
                try:
                    with db_session() as con:
                        role = con.execute("SELECT id FROM dbo.Roles WHERE name=N'customer'").fetchone()
                        row = con.execute('''INSERT INTO dbo.Users(email, full_name, password_hash, role_id)
                            OUTPUT INSERTED.id VALUES(?, ?, ?, ?)''',
                            (email, full_name, password_hash(password), role['id'])).fetchone()
                        user_row = con.execute('''SELECT u.id, u.email, u.full_name, r.name AS role,
                            c.code AS coupon_code, c.discount_percent AS coupon_percent
                            FROM dbo.Users u JOIN dbo.Roles r ON r.id=u.role_id
                            LEFT JOIN dbo.Coupons c ON c.assigned_user_id=u.id WHERE u.id=?''', (row['id'],)).fetchone()
                except pyodbc.IntegrityError:
                    return self.send_json(409, {'error': 'Пользователь с таким e-mail уже зарегистрирован.'})
                user = row_to_user(user_row)
                return self.send_json(201, {'token': make_token(user), 'user': user})
            if path == '/api/auth/login':
                email = str(data.get('email', '')).strip().lower()
                password = str(data.get('password', ''))
                if not email or not password:
                    return self.send_json(400, {'error': 'Заполните e-mail и пароль.'})
                with db_session() as con:
                    row = con.execute('''SELECT u.id, u.email, u.full_name, u.password_hash, u.active,
                        r.name AS role, c.code AS coupon_code, c.discount_percent AS coupon_percent
                        FROM dbo.Users u JOIN dbo.Roles r ON r.id=u.role_id
                        LEFT JOIN dbo.Coupons c ON c.assigned_user_id=u.id AND c.active=1
                        WHERE u.email=?''', (email,)).fetchone()
                if not row or not row['active'] or not verify_password(password, row['password_hash']):
                    return self.send_json(401, {'error': 'Неверный e-mail или пароль.'})
                user = row_to_user(row)
                return self.send_json(200, {'token': make_token(user), 'user': user})
            if path == '/api/appointments':
                user = self.current_user()
                if user is None:
                    return
                items = data.get('items')
                if not isinstance(items, list) or not items:
                    return self.send_json(400, {'error': 'Корзина пуста.'})
                with db_session() as con:
                    coupon = con.execute('SELECT discount_percent FROM dbo.Coupons WHERE assigned_user_id=? AND active=1', (user['id'],)).fetchone()
                    coupon_percent = int(coupon['discount_percent']) if coupon else 0
                    line_items = []
                    subtotal = 0
                    for item in items:
                        service_id = int(item.get('service_id', 0))
                        quantity = int(item.get('quantity', 0))
                        if quantity < 1 or quantity > 30:
                            return self.send_json(400, {'error': 'Количество услуги должно быть от 1 до 30.'})
                        service = con.execute('''SELECT id, name, price, discount_percent FROM dbo.Services
                            WHERE id=? AND active=1''', (service_id,)).fetchone()
                        if not service:
                            return self.send_json(400, {'error': 'Одна из услуг больше недоступна. Обновите каталог.'})
                        base = (int(service['price']) * (100 - int(service['discount_percent'])) + 50) // 100
                        final = (base * (100 - coupon_percent) + 50) // 100
                        line_total = final * quantity
                        subtotal += base * quantity
                        line_items.append({'service': service, 'quantity': quantity, 'line_total': line_total})
                    total = sum(item['line_total'] for item in line_items)
                    personal_discount = subtotal - total
                    appointment_time = datetime.now(timezone.utc).replace(tzinfo=None)
                    ids = []
                    for item in line_items:
                        inserted = con.execute('''INSERT INTO dbo.Appointments(user_id, service_id, quantity, appointment_datetime, status)
                            OUTPUT INSERTED.id VALUES(?, ?, ?, ?, N'confirmed')''',
                            (user['id'], item['service']['id'], item['quantity'], appointment_time)).fetchone()
                        appointment_id = inserted['id']
                        con.execute('''INSERT INTO dbo.Payments(appointment_id, amount, status, method)
                            VALUES(?, ?, N'simulated', N'demo')''', (appointment_id, item['line_total']))
                        ids.append(appointment_id)
                return self.send_json(201, {'message': 'Запись создана. Платёж сохранён в демонстрационном режиме.',
                                            'appointment_ids': ids, 'subtotal': subtotal,
                                            'personal_discount': personal_discount, 'total': total})
            if path == '/api/admin/services':
                admin = self.current_user(admin=True)
                if admin is None:
                    return
                name = str(data.get('name', '')).strip()
                description = str(data.get('description', '')).strip()
                try:
                    duration = int(data.get('duration_minutes', 0))
                    price = float(data.get('price', -1))
                    category_id = int(data.get('category_id', 0))
                    discount = int(data.get('discount_percent', 0))
                except (TypeError, ValueError):
                    return self.send_json(400, {'error': 'Проверьте числовые поля услуги.'})
                if not name or len(name) > 160 or not description or duration < 1 or duration > 1440 or price < 0 or price > 10000000 or discount < 0 or discount > 90:
                    return self.send_json(400, {'error': 'Проверьте название, описание, длительность, цену и скидку.'})
                with db_session() as con:
                    if not con.execute('SELECT id FROM dbo.Categories WHERE id=?', (category_id,)).fetchone():
                        return self.send_json(400, {'error': 'Выберите существующую категорию.'})
                    row = con.execute('''INSERT INTO dbo.Services(name, description, duration_minutes, price, category_id, discount_percent)
                        OUTPUT INSERTED.id VALUES(?, ?, ?, ?, ?, ?)''', (name, description, duration, price, category_id, discount)).fetchone()
                    service = con.execute('''SELECT s.id, s.name, s.description, s.duration_minutes, s.price,
                        s.discount_percent, s.active, s.category_id, c.name AS category
                        FROM dbo.Services s JOIN dbo.Categories c ON c.id=s.category_id WHERE s.id=?''', (row['id'],)).fetchone()
                return self.send_json(201, {'service': public_service(service)})
            if path == '/api/admin/categories':
                admin = self.current_user(admin=True)
                if admin is None:
                    return
                name = str(data.get('name', '')).strip()
                if len(name) < 2 or len(name) > 50:
                    return self.send_json(400, {'error': 'Название категории должно содержать от 2 до 50 символов.'})
                try:
                    with db_session() as con:
                        row = con.execute('''INSERT INTO dbo.Categories(name) OUTPUT INSERTED.id VALUES(?)''', (name,)).fetchone()
                        category = con.execute('SELECT id, name FROM dbo.Categories WHERE id=?', (row['id'],)).fetchone()
                except pyodbc.IntegrityError:
                    return self.send_json(409, {'error': 'Такая категория уже существует.'})
                return self.send_json(201, {'category': category})
            return self.send_json(404, {'error': 'Маршрут API не найден.'})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            return self.send_json(400, {'error': f'Некорректные данные запроса: {exc}'})
        except Exception as exc:
            return self.send_json(500, {'error': f'Ошибка API или соединения с MS SQL Server: {exc}'})

    def do_PATCH(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
            admin = self.current_user(admin=True)
            if admin is None:
                return
            service_edit_match = re.fullmatch(r'/api/admin/services/(\d+)', path)
            if service_edit_match:
                service_id = int(service_edit_match.group(1))
                try:
                    name = str(data.get('name', '')).strip()
                    description = str(data.get('description', '')).strip()
                    duration = int(data.get('duration_minutes', 0))
                    price = float(data.get('price', -1))
                    category_id = int(data.get('category_id', 0))
                    percent = int(data.get('discount_percent', 0))
                    active = 1 if data.get('active', True) else 0
                except (TypeError, ValueError):
                    return self.send_json(400, {'error': 'Проверьте числовые поля услуги.'})
                if not name or len(name) > 160 or not description or duration < 1 or duration > 1440 or price < 0 or price > 10000000 or percent < 0 or percent > 90:
                    return self.send_json(400, {'error': 'Проверьте название, описание, длительность, цену и скидку.'})
                with db_session() as con:
                    if not con.execute('SELECT id FROM dbo.Categories WHERE id=?', (category_id,)).fetchone():
                        return self.send_json(400, {'error': 'Выберите существующую категорию.'})
                    cursor = con.execute('''UPDATE dbo.Services SET name=?, description=?, duration_minutes=?, price=?,
                        category_id=?, discount_percent=?, active=? WHERE id=?''',
                        (name, description, duration, price, category_id, percent, active, service_id))
                    if cursor.rowcount == 0:
                        return self.send_json(404, {'error': 'Услуга не найдена.'})
                return self.send_json(200, {'message': 'Данные услуги сохранены.'})
            service_match = re.fullmatch(r'/api/admin/services/(\d+)/discount', path)
            if service_match:
                percent = int(data.get('discount_percent', -1))
                if percent < 0 or percent > 90:
                    return self.send_json(400, {'error': 'Скидка должна быть от 0 до 90 процентов.'})
                with db_session() as con:
                    cursor = con.execute('UPDATE dbo.Services SET discount_percent=? WHERE id=?', (percent, int(service_match.group(1))))
                    if cursor.rowcount == 0:
                        return self.send_json(404, {'error': 'Услуга не найдена.'})
                return self.send_json(200, {'message': 'Скидка на услугу обновлена.', 'discount_percent': percent})
            user_match = re.fullmatch(r'/api/admin/users/(\d+)/coupon', path)
            if user_match:
                user_id = int(user_match.group(1))
                percent = int(data.get('discount_percent', 0))
                code = str(data.get('code', '')).strip().upper() or f'PERSONAL{user_id}'
                if percent < 0 or percent > 90:
                    return self.send_json(400, {'error': 'Персональная скидка должна быть от 0 до 90 процентов.'})
                with db_session() as con:
                    if not con.execute('SELECT id FROM dbo.Users WHERE id=?', (user_id,)).fetchone():
                        return self.send_json(404, {'error': 'Пользователь не найден.'})
                    if percent == 0:
                        con.execute('DELETE FROM dbo.Coupons WHERE assigned_user_id=?', (user_id,))
                        return self.send_json(200, {'message': 'Персональная скидка снята.'})
                    existing = con.execute('SELECT id FROM dbo.Coupons WHERE assigned_user_id=?', (user_id,)).fetchone()
                    try:
                        if existing:
                            con.execute('''UPDATE dbo.Coupons SET code=?, discount_percent=?, active=1, created_by=? WHERE assigned_user_id=?''',
                                        (code, percent, admin['id'], user_id))
                        else:
                            con.execute('''INSERT INTO dbo.Coupons(code, discount_percent, assigned_user_id, kind, active, created_by)
                                VALUES(?, ?, ?, N'personal', 1, ?)''', (code, percent, user_id, admin['id']))
                    except pyodbc.IntegrityError:
                        return self.send_json(409, {'error': 'Такой код купона уже занят.'})
                return self.send_json(200, {'message': 'Персональный купон назначен.', 'code': code, 'discount_percent': percent})
            return self.send_json(404, {'error': 'Маршрут API не найден.'})
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            return self.send_json(400, {'error': f'Некорректные данные запроса: {exc}'})
        except Exception as exc:
            return self.send_json(500, {'error': f'Ошибка API или соединения с MS SQL Server: {exc}'})


def main():
    try:
        initialize_seed_data()
    except Exception as exc:
        print('Не удалось подключиться к MS SQL Server или подготовить начальные данные.')
        print(f'Проверьте ODBC-драйвер, строку подключения и выполнение sql/001_create_schema.sql. Детали: {exc}')
        raise SystemExit(1)
    server = ThreadingHTTPServer((HOST, PORT), ApiHandler)
    print(f'API запущен на http://{HOST}:{PORT}; база MS SQL Server: {DB_SERVER}/{DB_NAME}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nAPI остановлен.')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
