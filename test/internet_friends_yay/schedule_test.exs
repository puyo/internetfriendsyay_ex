defmodule InternetFriendsYay.ScheduleTest do
  use InternetFriendsYay.DataCase, async: true

  alias InternetFriendsYay.Schedule

  describe "people_at_indexes/2" do
    test "returns the expected values for Sydney and Perth" do
      data =
        <<0x80, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0>>

      person1 = %InternetFriendsYay.Db.Person{id: 1, name: "Syd", timezone: "Sydney", data: data}
      person2 = %InternetFriendsYay.Db.Person{id: 2, name: "Per", timezone: "Perth", data: data}
      now = ~U[2026-01-20 21:28:17.236367Z]

      assert Schedule.people_at_indexes([person1, person2], now) == %{
               314 => [person1],
               320 => [person2],
               329 => [person1],
               335 => [person2]
             }
    end
  end

  describe "person_available_indexes/1" do
    test "returns the expected value" do
      person = %InternetFriendsYay.Db.Person{
        id: 1,
        name: "Greg",
        timezone: "Sydney",
        data:
          <<0xFF, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0>>
      }

      assert Schedule.person_available_indexes(person, 0) == %{
               0 => true,
               1 => true,
               2 => true,
               3 => true,
               4 => true,
               5 => true,
               6 => true,
               7 => true,
               15 => true
             }
    end
  end
end
