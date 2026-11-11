
import requests
from getpass import getpass

API_URL_AUTH = "http://localhost:3000/api/arduino/auth"
API_URL_ENTREGA = "http://localhost:3000/api/entrega"
API_URL_DEVOLUCAO = "http://localhost:3000/api/devolucao"

ARMARIO = 1
COMPARTIMENTO = "A1"
ID_EPI = 1
QUANTIDADE = 1

OBSERVACAO_RETIRADA = "Retirada via armario"
OBSERVACAO_DEVOLUCAO = "Devolucao via armario"

ARDUINO_KEY = "tbBnYS4hQr7kx4Gfi37htk9Zh0DDTE9TivcX9Wpvqr5"
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
        return None, None

    except requests.exceptions.ConnectionError:
        print("Erro: nao foi possivel conectar a API. Verifique se o servidor esta ligado.")
        return None, None

    except requests.exceptions.RequestException as erro:
        print(f"Erro na requisicao: {erro}")
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
        print("Retirada autorizada e registrada no sistema!")
        return True

    else:
        print(
            f"Retirada negada: "
            f"{resultado.get('error', 'Erro desconhecido')}"
        )
        return False


def devolver_epi(matricula):
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
        print("Nenhuma entrega pendente para devolucao.")
        return False

    print("\n--- ENTREGAS PENDENTES ---")

    for i, p in enumerate(pendentes, 1):
        print(
            f"{i} - EPI: {p.get('epi')} | "
            f"Entrega #{p.get('id_entrega')} | "
            f"Qtd: {p.get('qtdEntregue')}"
        )

    escolha = input(
        "Escolha o numero da entrega para devolver (ou 0 para cancelar): "
    ).strip()

    if escolha == "0":
        return False

    try:
        idx = int(escolha) - 1

        if idx < 0 or idx >= len(pendentes):
            print("Escolha invalida.")
            return False

    except ValueError:
        print("Entrada invalida.")
        return False

    id_entrega = pendentes[idx].get("id_entrega")

    resposta, resultado = requisitar(
        "POST",
        API_URL_DEVOLUCAO,
        {
            "id_entrega": id_entrega,
            "quantidade": QUANTIDADE,
            "estado": "bom",
            "observacao": OBSERVACAO_DEVOLUCAO,
        },
    )

    if resposta is None:
        return False

    if resposta.ok:
        print("Devolucao registrada com sucesso!")
        return True

    else:
        print(
            f"Devolucao negada: "
            f"{resultado.get('error', 'Erro desconhecido')}"
        )
        return False


def main():
    try:
        print("ProtecTI - Sistema de gerenciamento de EPI")

        while True:
            print("\n--- MENU PRINCIPAL ---")
            print("1 - Retirar um EPI")
            print("2 - Devolver um EPI")
            print("0 - SAIR")

            opcao = input("Escolha uma opcao: ").strip()

            if opcao == "0" or opcao.upper() == "SAIR":
                print("Programa encerrado.")
                break

            if opcao not in ("1", "2"):
                print("Opcao invalida. Tente novamente.")
                continue

            matricula = input(
                "Matricula do funcionario: "
            ).strip()

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
                print(
                    "Acesso negado:",
                    resultado.get(
                        "error",
                        "Acesso negado pelo ProtecTI."
                    ),
                )
                continue

            id_func = resultado.get("id_func")

            if opcao == "1":
                retirar_epi(id_func)

            elif opcao == "2":
                devolver_epi(matricula)

    except KeyboardInterrupt:
        print("\nPrograma encerrado.")


if __name__ == "__main__":
    main()
