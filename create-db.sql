-- ============================================
-- protecTI - Script de criação do banco de dados
-- ============================================

CREATE DATABASE IF NOT EXISTS gestaoepis;

USE gestaoepis;

-- ============================================
-- Tabelas base (cargos, funcionários, usuários)
-- ============================================

CREATE TABLE IF NOT EXISTS cargo (
  id_cargo INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionario (
  id_func INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(15),
  setor VARCHAR(100),
  funcao VARCHAR(100),
  data_admissao DATE,
  status ENUM('ativo', 'inativo') DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  permissao TINYINT NOT NULL DEFAULT 1 COMMENT '1=funcionario, 2=tecnico, 3=admin',
  id_cargo INT,
  acesso_site BOOLEAN DEFAULT TRUE COMMENT 'Se o usuário pode acessar o site',
  FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
);

-- ============================================
-- Tabelas de EPIs
-- ============================================

CREATE TABLE IF NOT EXISTS epi (
  id_epi INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  ca VARCHAR(50) COMMENT 'Certificado de Aprovação',
  validade_ca DATE,
  quantidade_estoque INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabelas de movimentação
-- ============================================

CREATE TABLE IF NOT EXISTS entrega_epi (
  id_entrega INT AUTO_INCREMENT PRIMARY KEY,
  id_func INT NOT NULL,
  id_epi INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  data_entrega DATE NOT NULL,
  observacao TEXT,
  FOREIGN KEY (id_func) REFERENCES funcionario(id_func),
  FOREIGN KEY (id_epi) REFERENCES epi(id_epi)
);

CREATE TABLE IF NOT EXISTS devolucao_epi (
  id_devolucao INT AUTO_INCREMENT PRIMARY KEY,
  id_entrega INT NOT NULL,
  data_devolucao DATE NOT NULL,
  estado ENUM('bom', 'danificado', 'perdido') DEFAULT 'bom',
  observacao TEXT,
  FOREIGN KEY (id_entrega) REFERENCES entrega_epi(id_entrega)
);

-- ============================================
-- Tabelas de alertas
-- ============================================

CREATE TABLE IF NOT EXISTS alertas (
  id_alerta INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('vencimento_ca', 'estoque_baixo', 'devolucao_pendente') NOT NULL,
  mensagem TEXT NOT NULL,
  lido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Dados iniciais
-- ============================================

-- Cargos
INSERT INTO cargo (id_cargo, nome) VALUES
  (1, 'Técnico de Segurança'),
  (2, 'Administrador'),
  (3, 'Funcionário')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Usuário admin (senha: admin123)
INSERT INTO usuario (id_usuario, nome, senha, permissao, id_cargo, acesso_site) VALUES
  (1, 'Rafael Lamb', '$2b$12$lFVU7gn6AYy4i2FJsdn32egMdqgWCLtWVrG.t8z8rgdkZdqyF.ph.', 2, 2, TRUE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Usuário teste (senha: user123)
INSERT INTO usuario (id_usuario, nome, senha, permissao, id_cargo, acesso_site) VALUES
  (2, 'João Silva', '$2b$12$y/khdDnhSwcPdfN.p8XIVuC8lHft/55Wu5kbGQ.mz6q/vPxHWZBWa', 1, 1, TRUE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);