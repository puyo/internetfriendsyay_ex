defmodule InternetFriendsYayWeb.PageController do
  use InternetFriendsYayWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
