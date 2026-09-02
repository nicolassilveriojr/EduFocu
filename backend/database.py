import mysql.connector


DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "edufoco_user",
    "password": "123456",
    "database": "edufoco"
}


def conectar_banco():
    try:
        conexao = mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"]
        )

        print("======================================")
        print("CONEXÃO COM MYSQL REALIZADA!")
        print("Banco: edufoco")
        print("Usuário: edufoco_user")
        print("======================================")

        return conexao

    except mysql.connector.Error as erro:
        print(f"Erro ao conectar ao MySQL:")
        print(erro)
        return None


if __name__ == "__main__":

    conexao = conectar_banco()

    if conexao:
        cursor = conexao.cursor()

        cursor.execute("SELECT DATABASE(), USER();")

        resultado = cursor.fetchone()

        print(f"Banco conectado: {resultado[0]}")
        print(f"Usuário conectado: {resultado[1]}")

        cursor.close()
        conexao.close()

        print("Conexão encerrada.")

