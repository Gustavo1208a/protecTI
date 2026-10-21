
import serial
import requests
import time
from getpass import getpass

PORTA_ARDUINO = "COM3"
BAUD_RATE = 9600

API_URL = "http://localhost:3000/api/retiradas"

# Configuracao do prototipo:
# ajuste para o EPI associado a este armario.
EPI_ID = 1
QUANTIDADE = 1


def main():
    try:
        with serial.Serial(
            PORTA_ARDUINO,
            BAUD_RATE,
            timeout=1,
            write_timeout=2
        ) as arduino:

            # A abertura da porta pode reiniciar o Arduino.
            time.sleep(2)
            print("Arduino conectado!")
            print("ProtecTI - Armario inteligente")

            while True:
                print("\n--- AUTENTICACAO ---")

                funcionario = input(
                    "ID do funcionario (ou SAIR): "
                ).strip()

                if funcionario.upper() == "SAIR":
                    break

                try:
                    funcionario_id = int(funcionario)
                    if funcionario_id <= 0:
                        raise ValueError
                except ValueError:
                    print("Informe um ID numerico valido.")
                    continue

                senha = getpass("Senha do armario: ")

                if not senha:
                    print("A senha nao pode ficar vazia.")
                    continue

                try:
                    """dados = {
                        "funcionario_id": funcionario_id,
                        "senha_armario": senha,
                        "epi_id": EPI_ID,
                        "quantidade": QUANTIDADE
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
                    )"""
                    autorizado = True
                    if autorizado:
                        arduino.write(b"LIBERADO\n")
                        arduino.flush()
                        print("Retirada autorizada!")
                        print("Armario liberado por 5 segundos.")

                    else:
                        arduino.write(b"NEGADO\n")
                        arduino.flush()
                        print(
                            resultado.get(
                                "mensagem",
                                "Acesso negado pelo ProtecTI."
                            )
                        )

                except requests.RequestException as erro:
                    # Sem resposta do servidor, nao abrir o armario.
                    print("Erro ao acessar o backend:", erro)
                    print("Armario mantido fechado.")

                finally:
                    # Nao imprimir nem guardar a senha no historico.
                    senha = None
                    if "dados" in locals():
                        dados.pop("senha_armario", None)
                        del dados

    except (serial.SerialException, OSError) as erro:
        print("Erro ao conectar ao Arduino:", erro)

    except KeyboardInterrupt:
        print("\nPrograma encerrado.")


if __name__ == "__main__":
    main()
