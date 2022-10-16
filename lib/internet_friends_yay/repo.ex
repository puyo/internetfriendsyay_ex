defmodule InternetFriendsYay.Repo do
  use Ecto.Repo,
    otp_app: :internet_friends_yay,
    adapter: Ecto.Adapters.Postgres
end
