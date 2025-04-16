## Quick Start

`mkdir data`
`docker network create rdt`
`docker run -d --name mongo -p "27017:27017" --mount type=bind,src="$(pwd)/data",target=/data/db --network rdt rdt-mongo`
`docker run -d --name node -p "80:80" --network rdt --mount type=bind,src="$(pwd)/node/lib",target=/app/lib rdt-node`
