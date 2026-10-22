import serial
import requests
import time
from getpass import getpass

PORTA_ARDUINO = "COM3"
BAUD_RATE = 9600

API_URL = "http://localhost:3000/api/arduino/auth"

ARMARIO = 1
COMPARTIMENTO = "A1"

def main():
    try:
        with serial.Serial(
            PORTA_ARDUINO,
            BAUD_RATE,
            timeout=1,
            write_timeout=2
        ) as arduino:

            time.sleep(2)
            print("Arduino conectado!")
            print("ProtecTI - Armario inteligente")

            while True:
                print("\n--- AUTENTICACAO ---")

                matricula = input(
                    "Matricula do funcionario (ou SAIR): "
                ).strip()

                if matricula.upper() == "SAIR":
                    break

                if not matricula:
                    print("Informe uma matricula valida.")
                    continue

                senha = getpass("Senha do armario: ")

                if not senha:
                    print("A senha nao pode ficar vazia.")
                    continue

                try:
                    dados = {
                        "matricula": matricula,
                        "senha": senha,
                        "armario": ARMARIO,
                        "compartimento": COMPARTIMENTO
                    }

                    resposta = requests.post(
                        API_URL,
                        json=dados,
                        timeout=10
                    )

                    try:
                        resultado = resposta.json()
                    except ValueError:
                        resultado = {}

                    autorizado = (
                        resposta.ok
                        and resultado.get("autorizado") is True
                    )

                    if autorizado:
                        arduino.write(b"LIBERADO\n")
                        arduino.flush()
                        print("Retirada autorizada!")
                        print(f"   Funcionario: {resultado['funcionario']['nome']} (Matricula: {resultado['funcionario']['matricula']})")
                        print(f"   Armario: {ARMARIO} | Compartimento: {COMPARTIMENTO}")
                        print(f"   EPIs disponiveis: {'Sim' if resultado['tem_epis_disponiveis'] else 'Nao'}")
                        print("   Armario liberado por 5 segundos.")

                    else:
                        arduino.write(b"NEGADO\n")
                        arduino.flush()
                        print(
                            "Acesso negado:",
                            resultado.get(
                                "error",
                                "Acesso negado pelo ProtecTI."
                            )
                        )

                except requests.exceptions.Timeout:
                    print("Erro: a API demorou demais para responder.")
                    print("Armario mantido fechado.")

                except requests.exceptions.ConnectionError:
                    print("Erro: nao foi possivel conectar a API. Verifique se o servidor esta ligado.")
                    print("Armario mantido fechado.")

                except requests.exceptions.RequestException as erro:
                    print(f"Erro na requisicao: {erro}")
                    print("Armario mantido fechado.")

                finally:
                    senha = None

    except (serial.SerialException, OSError) as erro:
        print("Erro ao conectar ao Arduino:", erro)

    except KeyboardInterrupt:
        print("\nPrograma encerrado.")


if __name__ == "__main__":
    main()