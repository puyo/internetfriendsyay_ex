defmodule InternetFriendsYay.Schedule do
  alias InternetFriendsYay.{Db, Repo}
  import Ecto.Query

  @hours_per_day 24
  @minutes_per_hour 60
  @seconds_per_minute 60
  @indexes_per_hour 2
  @days_per_week 7
  @indexes_per_day @hours_per_day * @indexes_per_hour
  @indexes_per_week @days_per_week * @indexes_per_day
  @minutes_per_index div(@minutes_per_hour, @indexes_per_hour)
  @seconds_per_index @seconds_per_minute * @minutes_per_index
  @indexes 0..(@indexes_per_week - 1)

  @spec get!(Ecto.UUID.t()) :: Db.Schedule.t()
  def get!(uuid) do
    query = from s in Db.Schedule, preload: :people
    query |> Repo.get_by!(uuid: uuid)
  end

  @spec day_names() :: [binary()]
  def day_names, do: ~w(Monday Tuesday Wednesday Thursday Friday Saturday Sunday)

  @spec times_of_day() :: list(%{time: DateTime.t(), index: integer()})
  def times_of_day,
    do:
      0..(@indexes_per_day - 1)
      |> Enum.map(fn index ->
        minute = index * @minutes_per_index
        hours = div(minute, @minutes_per_hour)
        mins = rem(minute, @minutes_per_hour)
        date = Date.new!(2000, 1, 1)
        time = Time.new!(hours, mins, 0, 0)
        %{time: DateTime.new!(date, time), index: index}
      end)

  @spec indexes(integer()) :: Range.t()
  def indexes(index_in_day) do
    first = index_in_day
    last = index_in_day + @indexes_per_week - 1
    first..last//@indexes_per_day
  end

  @spec people_at_indexes(list(Db.Person.t()), DateTime.t()) :: any()
  def people_at_indexes(people, at) do
    availability = availability(people, at)

    @indexes
    |> Enum.map(fn index ->
      available_people =
        people
        |> Enum.map(fn person ->
          available_indexes = Map.get(availability, person.id)
          available = Map.get(available_indexes, index) == true
          {person, available}
        end)
        |> Enum.filter(fn {_person, available} ->
          available
        end)
        |> Enum.map(fn {person, _available} ->
          person
        end)

      {index, available_people}
    end)
    |> Stream.filter(fn {_index, available_people} ->
      length(available_people) > 0
    end)
    |> Enum.into(%{})
  end

  @spec availability([Db.Person.t()], DateTime.t()) :: %{integer() => %{integer() => boolean()}}
  def availability(people, at) do
    people
    |> Enum.map(fn person ->
      offset = location_offset(person_location(person), at)

      {
        person.id,
        person_available_indexes(person, offset)
      }
    end)
    |> Enum.into(%{})
  end

  @spec location_offset(binary(), DateTime.t()) :: integer()
  def location_offset(location, at) do
    # utc_offset is in seconds based roughly on lat
    # std_offset is the extra offset from DST
    at_local = at |> DateTime.shift_zone!(location)
    div(at_local.utc_offset + at_local.std_offset, @seconds_per_index)
  end

  def person_location(person) do
    Map.fetch!(rails_tz_mapping(), person.timezone)
  end

  @spec person_available_indexes(%{:data => bitstring()}, integer()) :: %{integer() => boolean()}
  def person_available_indexes(person, offset) do
    bytes = for <<x::8 <- person.data>>, do: x

    @indexes
    |> Enum.map(fn index ->
      byte_index = div(index, 8)
      bit_index = rem(index, 8)
      byte = Enum.at(bytes, byte_index)
      bit = byte |> Bitwise.>>>(bit_index) |> Bitwise.&&&(1)
      offset_index = rem(index - offset, @indexes_per_week)
      {offset_index, bit == 1}
    end)
    |> Enum.filter(fn {_index, available} -> available end)
    |> Enum.into(%{})
  end

  def rails_tz_mapping(), do: Application.get_env(:internet_friends_yay, :rails_tz_mapping)
end

# ruby

# Schedule

# def people_at_indexes(timezone)
#   result = Hash.new { |h, k| h[k] = [] }
#   monday = next_monday(timezone)
#   people.each do |person|
#     person_mon = next_monday(person.timezone)
#     index_offset = (person_mon.to_i - monday.to_i) / (60 * MINUTES_PER_INDEX)
#     add_person_to_schedule(person, index_offset, result)
#   end
#   result
# end

# def utc_index(index, timezone)
#   user_monday = next_monday(timezone) + (index * (60 * MINUTES_PER_INDEX))
#   utc_monday = next_monday('UTC')
#   index_offset = (user_monday.to_i - utc_monday.to_i) / (60 * MINUTES_PER_INDEX)
#   index_offset % INDEXES_PER_WEEK
# end

# def day_indexes(time_of_day_index)
#   (time_of_day_index...(time_of_day_index + INDEXES_PER_WEEK)).step(INDEXES_PER_DAY).to_a
# end

# def add_person_to_schedule(person, index_offset, schedule_hash)
#   person.available_indexes.each do |person_index|
#     index = (person_index + index_offset) % INDEXES_PER_WEEK
#     schedule_hash[index].push(person)
#   end
# end

# Person

# def available_at=(value)
#   result = [0] * Schedule::INDEXES_PER_WEEK
#   value.each do |index|
#     byte, shift = byte_shift(index)
#     result[byte] |= (1 << shift)
#   end
#   self.data = result.pack("c#{result.size}")
# end

# def available_at
#   result = {}
#   (0...Schedule::INDEXES_PER_WEEK).each do |index|
#     result[index] = true if available_at?(index)
#   end
#   result
# end

# def available_at?(index)
#   byte, shift = byte_shift(index)
#   (data.to_s.bytes.to_a[byte].to_i & (1 << shift)) != 0
# end

# def available_indexes
#   available_at.keys
# end

# private

# def byte_shift(index)
#   index.to_i.divmod(8)
# end

# def timezone_check
#   errors.add(:timezone) if ActiveSupport::TimeZone.new(timezone).nil?
# end
