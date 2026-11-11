import os
import serial
import requests
import time
from getpass import getpass

PORTA_ARDUINO = "COM3"
BAUD_RATE = 9600

API_URL_AUTH = "http://localhost:3000/api/arduino/auth"
API_URL_ENTREGA = "http://localhost:3000/api/entrega"
API_URL_DEVOLUCAO = "http://localhost:3000/api/devolucao"

ARMARIO = 1
COMPARTIMENTO = "A1"
ID_EPI = 1
QUANTIDADE = 1
OBSERVACAO_RETIRADA = "Retirada via armario Arduino"
OBSERVACAO_DEVOLUCAO = "Devolucao via armario Arduino"

ARDUINO_KEY = os.environ.get("ARDUINO_SECRET", "tbBnYS4hQr7kx4Gfi37htk9Zh0DDTE9TivcX9Wpvqr5")
HEADERS = {"X-Arduino-Key": ARDUINO_KEY}


def requisitar(metodo, url, payload=None):
    try:
        if metodo.upper() == "GET":
            resposta = requests.get(url, headers=HEADERS, timeout=10)
        else:
            resposta = requests.post(url, json=payload, headers=HEADERS, timeout=10)

        try:
            resultado = resposta.json()
        except ValueError:
            resultado = {}

        return resposta, resultado

    except requests.exceptions.Timeout:
        print("Erro: a API demorou demais para responder.")
        print("Armario mantido fechado.")
        return None, None

    except requests.exceptions.ConnectionError:
        print("Erro: nao foi possivel conectar a API. Verifique se o servidor esta ligado.")
        print("Armario mantido fechado.")
        return None, None

    except requests.exceptions.RequestException as erro:
        print(f"Erro na requisicao: {erro}")
        print("Armario mantido fechado.")
        return None, None


def autenticar(matricula, senha):
    resposta, resultado = requisitar(
        "POST",
        API_URL_AUTH,
        {
            "matricula": matricula,
            "senha": senha,
            "armario": ARMARIO,
            "compartimento": COMPARTIMENTO,
        },
    )
    return resposta, resultado


def retirar_epi(id_func):
    resposta, resultado = requisitar(
        "POST",
        API_URL_ENTREGA,
        {
            "id_func": id_func,
            "id_epi": ID_EPI,
            "quantidade": QUANTIDADE,
            "observacao": OBSERVACAO_RETIRADA,
        },
    )

    if resposta is None:
        return False

    if resposta.ok:
        arduino_write(b"LIBERADO\n")
        print("Retirada autorizada e registrada no sistema!")
        return True
    else:
        arduino_write(b"NEGADO\n")
        print(f"Retirada negada: {resultado.get('error', 'Erro desconhecido')}")
        return False


def devolver_epi(matricula, id_func):
    # Lista entregas pendentes para este funcionario
    resposta, resultado = requisitar("GET", API_URL_DEVOLUCAO)

    if resposta is None:
        return False

    pendentes = [
        p
        for p in (resultado.get("pendentes") or [])
        if p.get("matricula") == matricula
    ]

    if not pendentes:
        arduino_write(b"NEGADO\n")
        print("Nenhuma entrega pendente para devolucao.")
        return False

    print("\n--- ENTREGAS PENDENTES ---")
    for i, p in enumerate(pendentes, 1):
        print(f"{i} - EPI: {p.get('epi')} | Entrega #{p.get('id_entrega')} | Qtd: {p.get('qtdEntregue')}")

    escolha = input("Escolha o numero da entrega para devolver (ou 0 para cancelar): ").strip()
    if escolha == "0":
        return False

    try:
        idx = int(escolha) - 1
        if idx < 0 or idx >= len(pendentes):
            print("Escolha invalida.")
            arduino_write(b"NEGADO\n")
            return False
    except ValueError:
        print("Entrada invalida.")
        arduino_write(b"NEGADO\n")
        return False

    id_entrega = pendentes[idx].get("id_entrega")

    resposta, resultado = requisitar(
        "POST",
        API_URL_DEVOLUCAO,
        {
            "id_entrega": id_entrega,
            "id_func": id_func,
            "quantidade": QUANTIDADE,
            "estado": "bom",
            "observacao": OBSERVACAO_DEVOLUCAO,
        },
    )

    if resposta is None:
        return False

    if resposta.ok:
        arduino_write(b"LIBERADO\n")
        print("Devolucao registrada com sucesso!")
        return True
    else:
        arduino_write(b"NEGADO\n")
        print(f"Devolucao negada: {resultado.get('error', 'Erro desconhecido')}")
        return False


arduino = None


def arduino_write(dados):
    global arduino
    if arduino:
        arduino.write(dados)
        arduino.flush()


def main():
    global arduino

    try:
        arduino = serial.Serial(PORTA_ARDUINO, BAUD_RATE, timeout=1, write_timeout=2)
        time.sleep(2)
        print("Arduino conectado!")
        print("ProtecTI - Armario inteligente")

        while True:
            print("\n--- MENU PRINCIPAL ---")
            print("1 - Retirar um EPI")
            print("2 - Devolver um EPI")
            print("0 - SAIR")

            opcao = input("Escolha uma opcao: ").strip()

            if opcao == "0" or opcao.upper() == "SAIR":
                break

            if opcao not in ("1", "2"):
                print("Opcao invalida. Tente novamente.")
                continue

            matricula = input("Matricula do funcionario: ").strip()
            if not matricula:
                print("Informe uma matricula valida.")
                continue

            senha = getpass("Senha do armario: ")
            if not senha:
                print("A senha nao pode ficar vazia.")
                continue

            resposta, resultado = autenticar(matricula, senha)

            if resposta is None:
                continue

            if not resposta.ok or not resultado.get("autorizado"):
                arduino_write(b"NEGADO\n")
                print(
                    "Acesso negado:",
                    resultado.get("error", "Acesso negado pelo ProtecTI."),
                )
                continue

            id_func = resultado.get("id_func")

            if opcao == "1":
                retirar_epi(id_func)
            elif opcao == "2":
                devolver_epi(matricula, id_func)

    except (serial.SerialException, OSError) as erro:
        print("Erro ao conectar ao Arduino:", erro)

    except KeyboardInterrupt:
        print("\nPrograma encerrado.")

    finally:
        if arduino and arduino.is_open:
            arduino.close()


if __name__ == "__main__":
    main()
