import os
from flask import Flask, jsonify, send_from_directory
import mysql.connector
from mysql.connector import Error

# ============================================================
# CAMINHOS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# ============================================================
# FLASK
# ============================================================

app = Flask(__name__, static_folder=FRONTEND_DIR)

# ============================================================
# MYSQL
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "edufoco_user",
    "password": "EduFoco@123",
    "database": "edufoco"
}


def conectar_banco():
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# PÁGINA
# ============================================================

@app.route("/")
def inicio():
    return send_from_directory(FRONTEND_DIR, "student.html")


@app.route("/student.html")
def student_page():
    return send_from_directory(FRONTEND_DIR, "student.html")


# ============================================================
# SALAS
# ============================================================

@app.route("/api/salas")
def listar_salas():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                s.id,
                s.nome,
                COUNT(a.id) AS total_alunos
            FROM salas s
            LEFT JOIN alunos a ON a.sala_id = s.id
            GROUP BY s.id, s.nome
            ORDER BY s.id
        """)

        salas = cursor.fetchall()
        return jsonify(salas)

    except Error as erro:
        return jsonify({"erro": str(erro)}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao:
            conexao.close()


# ============================================================
# TURNOS
# ============================================================

@app.route("/api/turnos")
def listar_turnos():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, nome 
            FROM turnos 
            ORDER BY id
        """)

        turnos = cursor.fetchall()
        return jsonify(turnos)

    except Error as erro:
        return jsonify({"erro": str(erro)}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao:
            conexao.close()


# ============================================================
# ALUNOS
# ============================================================

@app.route("/api/alunos")
def listar_alunos():
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                a.id,
                a.nome,
                a.matricula,
                a.foto_path,
                s.id AS sala_id,
                s.nome AS sala,
                t.id AS turno_id,
                t.nome AS turno,
                COUNT(o.id) AS ocorrencias,
                COALESCE(SUM(o.duracao), 0) AS tempo_desatencao
            FROM alunos a
            LEFT JOIN salas s ON a.sala_id = s.id
            LEFT JOIN turnos t ON a.turno_id = t.id
            LEFT JOIN ocorrencias o ON a.id = o.aluno_id
            GROUP BY
                a.id,
                a.nome,
                a.matricula,
                a.foto_path,
                s.id,
                s.nome,
                t.id,
                t.nome
            ORDER BY a.nome
        """)

        alunos = cursor.fetchall()

        for aluno in alunos:
            ocorrencias = int(aluno["ocorrencias"] or 0)
            
            # ÍNDICE PROVISÓRIO
            # Depois podemos calcular usando tempo observado x tempo desatento.
            indice = max(0, 100 - (ocorrencias * 5))
            aluno["indice_atencao"] = indice

        return jsonify(alunos)

    except Error as erro:
        return jsonify({"erro": str(erro)}), 500

    finally:
        if cursor:
            cursor.close()
        if conexao:
            conexao.close()


# ============================================================
# INICIAR
# ============================================================

if __name__ == "__main__":
    print("======================================")
    print("             EDUFOCO IA")
    print("======================================")
    print("Servidor: http://127.0.0.1:5000")
    print("Banco: MySQL - edufoco")
    print("======================================")

    app.run(host="127.0.0.1", port=5000, debug=True)
