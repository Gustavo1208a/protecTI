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

INSERT IGNORE INTO cargo (id_cargo, nome) VALUES
  (1, 'Funcionário'),
  (2, 'Almoxarife'),
  (3, 'Administrador'),
  (4, 'Técnico de Segurança');

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
  id_cargo INT,
  acesso_site BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
);

-- ============================================
-- Tabelas de EPIs
-- ============================================

CREATE TABLE IF NOT EXISTS epi (
  id_epi INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  validade_ca DATE,
  quantidade_estoque INT DEFAULT 0,
  quantidade_minima INT DEFAULT 0,
  categoria VARCHAR(100),
  tamanho VARCHAR(20),
  lote VARCHAR(50),
  data_fabricacao DATE,
  armario VARCHAR(50),
  compartimento VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epi_lote (
  id_lote INT AUTO_INCREMENT PRIMARY KEY,
  id_epi INT NOT NULL,
  lote VARCHAR(50) NOT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  quantidade_disponivel INT NOT NULL DEFAULT 0,
  data_fabricacao DATE NULL,
  data_validade DATE NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_epi) REFERENCES epi(id_epi) ON DELETE CASCADE
);

-- ============================================
-- Tabelas de movimentação
-- ============================================

CREATE TABLE IF NOT EXISTS entrega_epi (
  id_entrega INT AUTO_INCREMENT PRIMARY KEY,
  id_func INT NOT NULL,
  id_epi INT NOT NULL,
  lote VARCHAR(50),
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
-- Tabelas de movimentação de estoque
-- ============================================

CREATE TABLE IF NOT EXISTS movimentacao_estoque (
  id_movimentacao INT AUTO_INCREMENT PRIMARY KEY,
  id_epi INT NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  quantidade INT NOT NULL,
  lote VARCHAR(50),
  data_validade DATE,
  armario VARCHAR(50),
  compartimento VARCHAR(50),
  motivo VARCHAR(100),
  observacao TEXT,
  data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_epi) REFERENCES epi(id_epi)
);

-- ============================================
-- Tabelas de alertas
-- ============================================

CREATE TABLE IF NOT EXISTS alertas (
  id_alerta INT AUTO_INCREMENT PRIMARY KEY,
  alerta_key VARCHAR(100) NOT NULL,
  tipo ENUM('vencimento_ca', 'estoque_baixo', 'devolucao_pendente') NOT NULL,
  mensagem TEXT NOT NULL,
  lido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_alerta_key (alerta_key)
);

-- ============================================
-- Dados iniciais
-- ============================================

-- Cargos
INSERT IGNORE INTO cargo (id_cargo, nome) VALUES
  (1, 'Funcionário'),
  (2, 'Almoxarife'),
  (3, 'Administrador'),
  (4, 'Técnico de Segurança');

-- Usuário admin (senha: admin123)
INSERT INTO usuario (id_usuario, nome, senha, id_cargo, acesso_site) VALUES
  (1, 'Rafael Lamb', '$2b$12$lFVU7gn6AYy4i2FJsdn32egMdqgWCLtWVrG.t8z8rgdkZdqyF.ph.', 3, TRUE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Funcionário correspondente ao usuário admin
INSERT INTO funcionario (id_func, nome, matricula, cpf, telefone, setor, funcao, data_admissao, status) VALUES
  (1, 'Rafael Lamb', '1', '000.000.000-00', '(00) 00000-0000', 'Gerência', 'Administrador', CURDATE(), 'ativo')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- EPI inicial
INSERT INTO epi (id_epi, nome, validade_ca, quantidade_estoque, quantidade_minima, categoria, tamanho, armario, compartimento) VALUES
  (1, 'Capacete de Segurança', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 10, 2, 'Proteção da Cabeça', 'Único', '1', 'A1')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Lote inicial do EPI (cadastrado como se tivesse sido registrado via entrada no site)
INSERT INTO epi_lote (id_epi, lote, quantidade, quantidade_disponivel, data_fabricacao, data_validade) VALUES
  (1, 'LOTE-001', 10, 10, DATE_ADD(CURDATE(), INTERVAL -6 MONTH), DATE_ADD(CURDATE(), INTERVAL 2 YEAR))
ON DUPLICATE KEY UPDATE lote = VALUES(lote);
