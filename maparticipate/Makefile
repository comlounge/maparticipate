build:
	pybabel extract -F babel.cfg -k T -o messages.pot .
	pybabel update -i messages.pot -d translations
	pybabel compile -d translations
	pybabel compile -d translations -D userbase

compile:
	pybabel compile -d translations
	pybabel compile -d translations -D userbase
