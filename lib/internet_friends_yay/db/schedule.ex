defmodule InternetFriendsYay.Db.Schedule do
  @moduledoc """
  Schema for a schedule
  """

  use Ecto.Schema

  schema "schedules" do
    field :uuid, Ecto.UUID
    has_many :people, InternetFriendsYay.Db.Person
    timestamps()
  end

  @type t :: %__MODULE__{}
end
