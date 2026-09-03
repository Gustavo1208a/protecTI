CREATE DATABASE gestaoepis;
USE gestaoepis;

CREATE TABLE epi (
    id_epi INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    estoque INT DEFAULT 0
);

CREATE TABLE administrador (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    permissao INT NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE arduino (
    id_arduino INT AUTO_INCREMENT PRIMARY KEY,
    codigo INT UNIQUE,
    localizacao VARCHAR(100)
);

CREATE TABLE fornecedor (
    id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    contato VARCHAR(100)
);

CREATE TABLE empresa (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE cargo (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    permissao INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    id_cargo INT,
    FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo) ON DELETE SET NULL
);

CREATE TABLE gerencia(
    id_gerencia INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT,
    id_usuario INT,
    id_epi INT,
    id_admin INT,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_epi) REFERENCES epi(id_epi) ON DELETE CASCADE,
    FOREIGN KEY (id_admin) REFERENCES administrador(id_admin) ON DELETE CASCADE
);

CREATE TABLE funcionario(
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    id_cargo INT,
    FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo) ON DELETE SET NULL
);

CREATE TABLE empresa_fornecedor(
    id_empresa INT,
    id_fornecedor INT,
    PRIMARY KEY (id_empresa, id_fornecedor),
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor) ON DELETE CASCADE
);

CREATE TABLE empresa_arduino(
    id_empresa INT,
    id_arduino INT,
    PRIMARY KEY (id_empresa, id_arduino),
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_arduino) REFERENCES arduino(id_arduino) ON DELETE CASCADE
);

CREATE TABLE empresa_funcionario(
    id_empresa INT,
    id_funcionario INT,
    PRIMARY KEY (id_empresa, id_funcionario),
    FOREIGN KEY (id_empresa) REFERENCES empresa(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario) ON DELETE CASCADE
);