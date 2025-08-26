Usage instructions:

	Frontend:

		Open a shell (CMD / Terminal) and cd into the "frontend" folder.

		Enter the command "npm run dev"

	Backend:

		(Open a shell [CMD / Terminal] and) cd into the "backend" folder.

		Enter the command "uvicorn backend:app --host localhost --port 8000 --reload --ssl-keyfile key.pem --ssl-certfile cert.pem"

			This command will run the backend service on the localhost address using port 8000 and will update when the backend code is changed.

			SSL requires --ssl-keyfile and --ssl-certfile and the files are included.

	Browser:

		Go to https://localhost to see the service in operation.
