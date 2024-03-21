defmodule InternetFriendsYayWeb.ScheduleLive.Show do
  use InternetFriendsYayWeb, :live_view

  alias InternetFriendsYay.{Db, Repo}

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_params(%{"id" => id}, _, socket) do
    {:noreply,
     socket
     |> assign(:page_title, page_title(socket.assigns.live_action))
     |> assign(:schedule, Db.Schedule |> Repo.get_by!(uuid: id))}
  end

  defp page_title(:show), do: "Show Schedule"
  defp page_title(:edit), do: "Edit Schedule"
end
