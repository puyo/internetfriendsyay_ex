defmodule InternetFriendsYayWeb.PageController do
  use InternetFriendsYayWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
