
#include <LiquidCrystal.h>
#include <Servo.h>

// LCD: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

Servo trava;

// Pinos dos componentes
const int pinoServo = 9;
const int ledVerde = 7;
const int ledVermelho = 6;

// Posicoes do servo
const int fechado = 0;
const int aberto = 90;

// Estado da caixa
bool caixaAberta = false;
unsigned long momentoAbertura = 0;
const unsigned long tempoAberto = 5000;

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(100);

  lcd.begin(16, 2);

  pinMode(ledVerde, OUTPUT);
  pinMode(ledVermelho, OUTPUT);

  trava.attach(pinoServo);
  trava.write(fechado);

  digitalWrite(ledVerde, LOW);
  digitalWrite(ledVermelho, HIGH);

  lcd.setCursor(0, 0);
  lcd.print("Armario de EPIs");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");

  delay(1500);
  mostrarAcesso();

  Serial.println("ARDUINO_PRONTO");
}

void loop() {
  // Recebe a autorizacao do Python
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();

    if (comando == "LIBERADO" && !caixaAberta) {
      destravar();
    }
    else if (comando == "NEGADO" && !caixaAberta) {
      acessoNegado();
    }
  }

  // Fecha automaticamente apos 5 segundos
  if (caixaAberta &&
      millis() - momentoAbertura >= tempoAberto) {
    travarCaixa();
  }
}

void destravar() {
  trava.write(aberto);

  caixaAberta = true;
  momentoAbertura = millis();

  digitalWrite(ledVerde, HIGH);
  digitalWrite(ledVermelho, LOW);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Acesso liberado");
  lcd.setCursor(0, 1);
  lcd.print("Retire o EPI");

  Serial.println("ACESSO_AUTORIZADO");
}

void acessoNegado() {
  digitalWrite(ledVerde, LOW);
  digitalWrite(ledVermelho, HIGH);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Acesso negado");
  lcd.setCursor(0, 1);
  lcd.print("Verifique dados");

  Serial.println("ACESSO_NEGADO");

  delay(1500);
  mostrarAcesso();
}

void travarCaixa() {
  trava.write(fechado);

  caixaAberta = false;

  digitalWrite(ledVerde, LOW);
  digitalWrite(ledVermelho, HIGH);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Caixa fechada");
  lcd.setCursor(0, 1);
  lcd.print("Acesso encerrado");

  Serial.println("CAIXA_FECHADA");

  delay(1500);
  mostrarAcesso();
}

void mostrarAcesso() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Armario de EPIs");
  lcd.setCursor(0, 1);
  lcd.print("Aguardando login");
}
