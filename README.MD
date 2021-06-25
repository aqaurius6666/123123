#Cách deploy

Cấu hình & port xem tại .dev:

 - Cấu hình & port:  deploy -> dev -> .env.dev
 - Run: deploy -> dev -> restart.sh
 - Stop: deploy -> dev -> stop.sh
 - Log: deploy -> dev -> log.sh

MONGO-EXPRESS: Dùng để view DB
 - Port: .env.dev


 - [] Dùng let, const thay vì dùng var
 - [] Format code trước khi tạo pull request

#Configure Stripe Webhook

```stripe login```

Tài khoản Stripe:
cloneoftung@gmail.com |
Tcdt^sp6bWv&Rv4

```stripe listen --forward-to localhost:2999/webhook```