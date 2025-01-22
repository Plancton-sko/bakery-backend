# Use uma imagem base do Node.js
FROM node:20-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Instale o CLI do Nest.js globalmente
RUN npm install -g @nestjs/cli pm2

# Copie os arquivos package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install --production

# Instale pacotes adicionais necessários
RUN npm install --save @types/express multer

# Copie o restante do código para o contêiner
COPY . .

# Compile o projeto
RUN npm run build

# Exponha a porta utilizada pela aplicação Nest.js
EXPOSE 5000

# Comando para iniciar a aplicação com PM2 em cluster
CMD ["pm2-runtime", "start", "dist/main.js", "--name", "app-cluster", "-i", "8"]