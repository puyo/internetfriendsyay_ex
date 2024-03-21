defmodule InternetFriendsYay.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      InternetFriendsYayWeb.Telemetry,
      InternetFriendsYay.Repo,
      {DNSCluster, query: Application.get_env(:internet_friends_yay, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: InternetFriendsYay.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: InternetFriendsYay.Finch},
      # Start a worker by calling: InternetFriendsYay.Worker.start_link(arg)
      # {InternetFriendsYay.Worker, arg},
      # Start to serve requests, typically the last entry
      InternetFriendsYayWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: InternetFriendsYay.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    InternetFriendsYayWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
