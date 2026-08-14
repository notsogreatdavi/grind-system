# Notificações

O sistema vem até você (§9): um timer systemd de usuário chama `POST /api/notify`, a rota
deriva o estado com as mesmas funções da tela e publica em [ntfy.sh](https://ntfy.sh).

Nada é enviado sem motivo — check-in já feito, dia não vazio, teto não atingido ou Ω fora
de um marco resultam em silêncio. Notificação sem motivo ensina a ignorar.

| Gatilho | Quando | Só dispara se |
|---|---|---|
| `checkin` | 08:00, todo dia | ainda não houve check-in hoje |
| `risco` | 21:00, todo dia | o dia está vazio |
| `teto` | 21:05, todo dia | o XP está no teto da classe |
| `marco-vazio` | 21:05, todo dia | Ω acabou de bater 30, 50 ou 100 |
| `fechamento` | domingo, 20:00 | sempre |

## Servidor

Três variáveis na Vercel, em `production`:

| Variável | Valor |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | *Supabase › Project Settings › API Keys* |
| `GRIND_NOTIFY_SECRET` | `openssl rand -hex 32` |
| `NTFY_TOPIC` | um nome difícil de adivinhar — no ntfy.sh, quem sabe o tópico lê tudo |

A service role key ignora a RLS: ela existe aqui porque o timer não tem sessão de usuário.
É a única parte do sistema que roda sem estar logada, e por isso a rota exige o segredo no
header `x-grind-secret` antes de tocar no banco.

## Cliente

```bash
install -Dm600 infra/notify.env.template ~/.config/grind/notify.env
$EDITOR ~/.config/grind/notify.env          # mesmo GRIND_NOTIFY_SECRET da Vercel

mkdir -p ~/.config/systemd/user
cp infra/grind-notify@.service infra/grind-notify@*.timer ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable --now grind-notify@{checkin,risco,teto,marco-vazio,fechamento}.timer
```

No celular, instale o app do ntfy e assine o tópico de `NTFY_TOPIC`.

## Conferir

```bash
systemctl --user list-timers 'grind-notify@*'
systemctl --user start grind-notify@checkin.service   # dispara agora
journalctl --user -u 'grind-notify@*' -n 20
```
