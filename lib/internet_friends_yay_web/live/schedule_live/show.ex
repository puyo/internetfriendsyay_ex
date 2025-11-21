defmodule InternetFriendsYayWeb.ScheduleLive.Show do
  use InternetFriendsYayWeb, :live_view

  alias InternetFriendsYay.{Db, Repo, Schedule}
  import Ecto.Query

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  @impl true
  @spec handle_params(map(), any(), %{
          :assigns => atom() | %{:live_action => :edit | :show, optional(any()) => any()},
          optional(any()) => any()
        }) :: {:noreply, map()}
  def handle_params(%{"id" => uuid}, _, socket) do
    schedule = Schedule.get!(uuid)
    people = schedule.people |> Enum.sort_by(fn p -> p.name end)
    at = DateTime.utc_now()
    people_at_indexes = Schedule.people_at_indexes(people, at)
    people_count = length(people)

    people_colours =
      Enum.with_index(people)
      |> Enum.map(fn {person, index} ->
        {person.id, hue(index, people_count)}
      end)
      |> Enum.into(%{})

    {
      :noreply,
      socket
      |> assign(:page_title, page_title(socket.assigns.live_action))
      |> assign(:schedule, schedule)
      |> assign(:at, at)
      |> assign(:people, people)
      |> assign(:people_colours, people_colours)
      |> assign(:people_at_indexes, people_at_indexes)
      |> assign(:people_count, people_count)
    }
  end

  defp person_chip(%{people_colours: people_colours, person: person} = assigns) do
    assigns = assign(assigns, hue: Map.get(people_colours, person.id), name: person.name)

    ~H"""
    <span class="person chip" style={["background-color: hsl(#{@hue}, 50%, 80%)"]}>
      {@name}{if assigns[:extra], do: " - #{@extra}"}
    </span>
    """
  end

  defp hue(index, total) do
    index * div(360, total)
  end

  defp page_title(:show), do: "Show Schedule"
  defp page_title(:edit), do: "Edit Schedule"
end
