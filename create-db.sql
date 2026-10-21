DROP DATABASE IF EXISTS gestaoepis;

CREATE DATABASE gestaoepis
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestaoepis;

CREATE TABLE setor (
  id_setor  INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_setor_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE cargo (
  id_cargo  INT AUTO_INCREMENT PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_cargo_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE categoria_epi (
  id_categoria  INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_categoria_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE fornecedor (
  id_fornecedor  INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(150) NOT NULL,
  cnpj           VARCHAR(18)  NULL,
  telefone       VARCHAR(20)  NULL,
  UNIQUE KEY uq_fornecedor_nome (nome),
  UNIQUE KEY uq_fornecedor_cnpj (cnpj)
) ENGINE=InnoDB;

CREATE TABLE armario (
  id_armario  INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_armario_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE tipo_alerta (
  codigo      VARCHAR(30) PRIMARY KEY,
  descricao   VARCHAR(100) NOT NULL,
  prioridade  ENUM('Alta','Média','Baixa') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE funcionario (
  id_func        INT AUTO_INCREMENT PRIMARY KEY,
  matricula      VARCHAR(20)  NOT NULL,
  nome           VARCHAR(150) NOT NULL,
  cpf            VARCHAR(14)  NOT NULL,
  telefone       VARCHAR(20)  NULL,
  setor          VARCHAR(100) NULL,
  funcao         VARCHAR(100) NULL,
  data_admissao  DATE         NULL,
  status         ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_func_matricula (matricula),
  UNIQUE KEY uq_func_cpf (cpf),
  KEY idx_func_setor (setor),
  CONSTRAINT fk_func_setor FOREIGN KEY (setor) REFERENCES setor (nome)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE usuario (
  id_usuario   INT PRIMARY KEY,
  id_func      INT NULL,
  nome         VARCHAR(150) NOT NULL,
  senha        VARCHAR(255) NOT NULL,
  permissao    TINYINT NOT NULL DEFAULT 1,
  id_cargo     INT NULL,
  acesso_site  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_func (id_func),
  CONSTRAINT ck_usuario_permissao CHECK (permissao BETWEEN 1 AND 3),
  CONSTRAINT fk_usuario_func  FOREIGN KEY (id_func)  REFERENCES funcionario (id_func)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_usuario_cargo FOREIGN KEY (id_cargo) REFERENCES cargo (id_cargo)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE epi (
  id_epi              INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(150) NOT NULL,
  descricao           TEXT NULL,
  ca                  VARCHAR(50) NOT NULL,
  validade_ca         DATE NULL,
  quantidade_estoque  INT NOT NULL DEFAULT 0,
  quantidade_minima   INT NOT NULL DEFAULT 0,
  categoria           VARCHAR(100) NULL,
  tamanho             VARCHAR(20)  NULL,
  lote                VARCHAR(50)  NULL,
  fornecedor          VARCHAR(150) NULL,
  data_fabricacao     DATE NULL,
  armario             VARCHAR(50)  NULL,