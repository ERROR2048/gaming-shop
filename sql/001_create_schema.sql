IF DB_ID(N'GameCareDB') IS NULL
BEGIN
    CREATE DATABASE GameCareDB;
END;
GO

USE GameCareDB;
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        name NVARCHAR(30) NOT NULL CONSTRAINT UQ_Roles_name UNIQUE,
        description NVARCHAR(200) NOT NULL CONSTRAINT DF_Roles_description DEFAULT N''
    );
END;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        email NVARCHAR(254) NOT NULL,
        full_name NVARCHAR(120) NOT NULL,
        password_hash NVARCHAR(300) NOT NULL,
        role_id INT NOT NULL,
        active BIT NOT NULL CONSTRAINT DF_Users_active DEFAULT 1,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Users_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Users_email UNIQUE(email),
        CONSTRAINT FK_Users_Roles FOREIGN KEY(role_id) REFERENCES dbo.Roles(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
        name NVARCHAR(50) NOT NULL CONSTRAINT UQ_Categories_name UNIQUE,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Categories_created_at DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.Services', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Services (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Services PRIMARY KEY,
        name NVARCHAR(160) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        duration_minutes INT NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        category_id INT NOT NULL,
        discount_percent TINYINT NOT NULL CONSTRAINT DF_Services_discount DEFAULT 0,
        active BIT NOT NULL CONSTRAINT DF_Services_active DEFAULT 1,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Services_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_Services_duration CHECK(duration_minutes > 0),
        CONSTRAINT CK_Services_price CHECK(price >= 0),
        CONSTRAINT CK_Services_discount CHECK(discount_percent BETWEEN 0 AND 90),
        CONSTRAINT FK_Services_Categories FOREIGN KEY(category_id) REFERENCES dbo.Categories(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Coupons (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Coupons PRIMARY KEY,
        code NVARCHAR(40) NOT NULL CONSTRAINT UQ_Coupons_code UNIQUE,
        discount_percent TINYINT NOT NULL,
        assigned_user_id INT NULL,
        kind NVARCHAR(20) NOT NULL CONSTRAINT DF_Coupons_kind DEFAULT N'personal',
        active BIT NOT NULL CONSTRAINT DF_Coupons_active DEFAULT 1,
        created_by INT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Coupons_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_Coupons_discount CHECK(discount_percent BETWEEN 1 AND 90),
        CONSTRAINT FK_Coupons_AssignedUser FOREIGN KEY(assigned_user_id) REFERENCES dbo.Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Coupons_CreatedBy FOREIGN KEY(created_by) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_Coupons_AssignedUser UNIQUE(assigned_user_id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Appointments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Appointments (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Appointments PRIMARY KEY,
        user_id INT NOT NULL,
        service_id INT NOT NULL,
        quantity INT NOT NULL CONSTRAINT DF_Appointments_quantity DEFAULT 1,
        appointment_datetime DATETIME2(0) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_Appointments_status DEFAULT N'confirmed',
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Appointments_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_Appointments_quantity CHECK(quantity > 0),
        CONSTRAINT FK_Appointments_Users FOREIGN KEY(user_id) REFERENCES dbo.Users(id),
        CONSTRAINT FK_Appointments_Services FOREIGN KEY(service_id) REFERENCES dbo.Services(id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
        appointment_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_Payments_status DEFAULT N'simulated',
        method NVARCHAR(30) NOT NULL CONSTRAINT DF_Payments_method DEFAULT N'demo',
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Payments_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_Payments_amount CHECK(amount >= 0),
        CONSTRAINT FK_Payments_Appointments FOREIGN KEY(appointment_id) REFERENCES dbo.Appointments(id) ON DELETE CASCADE,
        CONSTRAINT UQ_Payments_Appointment UNIQUE(appointment_id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Services_Category' AND object_id=OBJECT_ID(N'dbo.Services'))
    CREATE INDEX IX_Services_Category ON dbo.Services(category_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Appointments_User' AND object_id=OBJECT_ID(N'dbo.Appointments'))
    CREATE INDEX IX_Appointments_User ON dbo.Appointments(user_id);
GO
