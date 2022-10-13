defmodule InternetFriendsYay.Repo.Migrations.CreatePeopleAndSchedules do
  use Ecto.Migration

  def change do
    create_if_not_exists table(:schedules) do
      add(:uuid, :uuid, null: false)
      timestamps(default: fragment("NOW()"), null: false)
    end

    create_if_not_exists(index(:schedules, [:uuid]))

    create table(:people) do
      add(:schedule_id, references(:schedules), null: false)
      add(:name, :text, null: false)
      add(:timezone, :text, null: false)
      add(:data, :binary, null: false)
      add(:available, :bit, size: 336, null: false, default: fragment("0::bit(336)"))
      timestamps(default: fragment("NOW()"), null: false)
    end
  end
end
