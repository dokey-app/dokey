# Lessons
<!-- appended by /fix: - <symptom> -> <root cause> -> <prevention>
     /rules distills recurring lines into CLAUDE.md or hooks, then deletes them. -->
- Абзац отрендерился заголовком H2, а строка таблицы — текстом -> правка документа скриптом (`sed Nc\`, удаление строк по номерам) съела пустую строку-разделитель, и в исходнике это не видно -> markdown правится с проверкой соседних строк, а структура документов держится тестом `tests/unit/docs-structure.test.ts` (RUN-01)
