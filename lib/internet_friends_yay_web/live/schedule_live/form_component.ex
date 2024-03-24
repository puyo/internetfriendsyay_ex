defmodule InternetFriendsYayWeb.ScheduleLive.FormComponent do
  use InternetFriendsYayWeb, :live_component

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.header>
        <%= @title %>
        <:subtitle>Use this form to manage schedule records in your database.</:subtitle>
      </.header>

      <.simple_form
        for={@form}
        id="schedule-form"
        phx-target={@myself}
        phx-change="validate"
        phx-submit="save"
      >
        <:actions>
          <.button phx-disable-with="Saving...">Save Schedule</.button>
        </:actions>
      </.simple_form>
    </div>
    """
  end

  @impl true
  def update(%{schedule: schedule} = assigns, socket) do
    # changeset = App.change_schedule(schedule)

    {
      :ok,
      socket
      |> assign(assigns)
      # |> assign_form(changeset)
    }
  end

  @impl true
  def handle_event("validate", %{"schedule" => schedule_params}, socket) do
    changeset =
      socket.assigns.schedule
      # |> App.change_schedule(schedule_params)
      |> Map.put(:action, :validate)

    {:noreply, assign_form(socket, changeset)}
  end

  def handle_event("save", %{"schedule" => schedule_params}, socket) do
    save_schedule(socket, socket.assigns.action, schedule_params)
  end

  defp save_schedule(socket, :edit, schedule_params) do
    case App.update_schedule(socket.assigns.schedule, schedule_params) do
      {:ok, schedule} ->
        notify_parent({:saved, schedule})

        {:noreply,
         socket
         |> put_flash(:info, "Schedule updated successfully")
         |> push_patch(to: socket.assigns.patch)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp save_schedule(socket, :new, schedule_params) do
    case App.create_schedule(schedule_params) do
      {:ok, schedule} ->
        notify_parent({:saved, schedule})

        {:noreply,
         socket
         |> put_flash(:info, "Schedule created successfully")
         |> push_patch(to: socket.assigns.patch)}

      {:error, %Ecto.Changeset{} = changeset} ->
        {:noreply, assign_form(socket, changeset)}
    end
  end

  defp assign_form(socket, %Ecto.Changeset{} = changeset) do
    assign(socket, :form, to_form(changeset))
  end

  defp notify_parent(msg), do: send(self(), {__MODULE__, msg})
end
