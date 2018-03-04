FROM node

RUN mkdir /app

WORKDIR /app

COPY . .

RUN npm i && \
    chmod +x start.sh

EXPOSE 5000

CMD ["/app/start.sh"]
