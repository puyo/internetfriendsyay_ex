defmodule InternetFriendsYayWeb.ScheduleLive.Index do
  use InternetFriendsYayWeb, :live_view

  alias InternetFriendsYay.{Db, Repo}

  @impl true
  def mount(_params, _session, socket) do
    {:ok, assign(socket, :schedules, Db.Schedule |> Repo.all())}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit Schedule")
    |> assign(:schedule, Db.Schedule |> Repo.get!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Schedule")
    |> assign(:schedule, %Db.Schedule{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Schedules")
    |> assign(:schedule, nil)
  end

  @impl true
  def handle_info({InternetFriendsYayWeb.ScheduleLive.FormComponent, {:saved, schedule}}, socket) do
    {:noreply, stream_insert(socket, :schedules, schedule)}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    schedule = Db.Schedule |> Repo.get!(id)
    # {:ok, _} = App.delete_schedule(schedule)

    {:noreply, stream_delete(socket, :schedules, schedule)}
  end
end
