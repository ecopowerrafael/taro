# Guia de Deploy no Hostinger

## Configuração das Variáveis de Ambiente

Para que o servidor funcione corretamente, você precisa configurar as variáveis de ambiente no painel de controle do Hostinger.

### 1. Conectar ao Hostinger via SSH

```bash
ssh seu_usuario@seu_host.hostingersite.com
```

### 2. Criar arquivo `.env` no diretório `api/`

```bash
cd /home/seu_usuario/public_html/api
nano .env
```

### 3. Copiar o conteúdo do `.env.example` e preenchê-lo com suas informações

```
# Database Configuration
DB_HOST=seu_host_mysql
DB_PORT=3306
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_NAME=seu_database_name
DB_POOL_SIZE=10

# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_live_seu_public_key (ou pk_test_xxx para teste)
STRIPE_SECRET_KEY=sk_live_seu_secret_key (ou sk_test_xxx para teste)
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Web Push (VAPID Keys) - Manter os valores padrão ou gerar novos
VAPID_PUBLIC_KEY=seu_public_key
VAPID_PRIVATE_KEY=seu_private_key

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 4. Testar a Conexão do Banco de Dados

```bash
cd /home/seu_usuario/public_html
node -c api/server.mjs
```

Isso vai validar a sintaxe e verificar se consegue carregar todos os módulos.

### 5. Reiniciar o Servidor Node.js

Através do painel de controle do Hostinger ou via SSH:

```bash
pm2 restart taro-api
```

## Diagnóstico de Erros 503

Se você continuar recebendo erro 503, teste os endpoints de diagnóstico:

```bash
curl https://appastria.online/api/ping-v6
curl https://appastria.online/api/health
curl https://appastria.online/api/config-error
curl https://appastria.online/api/runtime-info
```

### O que verificar:

1. **`/api/config-error`** - Mostra erros na configuração do banco de dados
2. **`/api/runtime-info`** - Mostra informações do servidor Node.js
3. Verifique o arquivo `crash.log` para erros não capturados

## Troubleshooting

### Erro: "Variáveis de banco ausentes"

- Verifique se o arquivo `.env` foi criado corretamente
- Confirme que você tem permissão de leitura no arquivo `.env`
- Reinicie o servidor Node.js

### Erro: "Stripe não está configurado"

- Verifique se `STRIPE_SECRET_KEY` está definida no `.env`
- Use `pk_test_xxx` e `sk_test_xxx` para testes
- Use `pk_live_xxx` e `sk_live_xxx` para produção

### Auto-deploy não está funcionando

- Verifique se a chave SSH está configurada no GitHub
- Confirme que o webhook do GitHub está apontando para o Hostinger
- Verifique os logs do servidor

## Logs Úteis

### Arquivo `startup.log`
Contém logs de inicialização do servidor.

### Arquivo `crash.log`
Contém logs de erros não capturados.

### SSH - Ver logs em tempo real

```bash
tail -f ~/public_html/crash.log
tail -f ~/public_html/startup.log
```

## Auto-Deploy no GitHub

O servidor está configurado para fazer auto-deploy quando você faz push para o repositório.

1. Configure a chave SSH no GitHub (Deploy Keys)
2. Configure o webhook do GitHub no Hostinger (ou use um serviço como Vercel/Netlify)
3. Cada push para `main` acionará o deploy automático

