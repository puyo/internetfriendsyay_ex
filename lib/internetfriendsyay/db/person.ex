defmodule InternetFriendsYay.Db.Person do
  @moduledoc """
  Schema for a person
  """

  use Ecto.Schema

  schema "people" do
    field(:name, :string)
    field(:timezone, :string)
    field(:data, :binary)
    field(:bits, :binary)
    belongs_to(:schedule, InternetFriendsYay.Db.Schedule)
    timestamps()
  end

  @type t :: %__MODULE__{}
end
