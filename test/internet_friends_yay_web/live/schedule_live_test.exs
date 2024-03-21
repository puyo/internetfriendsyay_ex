defmodule InternetFriendsYayWeb.ScheduleLiveTest do
  use InternetFriendsYayWeb.ConnCase

  import Phoenix.LiveViewTest
  import InternetFriendsYay.AppFixtures

  @create_attrs %{}
  @update_attrs %{}
  @invalid_attrs %{}

  defp create_schedule(_) do
    schedule = schedule_fixture()
    %{schedule: schedule}
  end

  describe "Index" do
    setup [:create_schedule]

    test "lists all schedules", %{conn: conn} do
      {:ok, _index_live, html} = live(conn, ~p"/schedules")

      assert html =~ "Listing Schedules"
    end

    test "saves new schedule", %{conn: conn} do
      {:ok, index_live, _html} = live(conn, ~p"/schedules")

      assert index_live |> element("a", "New Schedule") |> render_click() =~
               "New Schedule"

      assert_patch(index_live, ~p"/schedules/new")

      assert index_live
             |> form("#schedule-form", schedule: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert index_live
             |> form("#schedule-form", schedule: @create_attrs)
             |> render_submit()

      assert_patch(index_live, ~p"/schedules")

      html = render(index_live)
      assert html =~ "Schedule created successfully"
    end

    test "updates schedule in listing", %{conn: conn, schedule: schedule} do
      {:ok, index_live, _html} = live(conn, ~p"/schedules")

      assert index_live |> element("#schedules-#{schedule.id} a", "Edit") |> render_click() =~
               "Edit Schedule"

      assert_patch(index_live, ~p"/schedules/#{schedule}/edit")

      assert index_live
             |> form("#schedule-form", schedule: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert index_live
             |> form("#schedule-form", schedule: @update_attrs)
             |> render_submit()

      assert_patch(index_live, ~p"/schedules")

      html = render(index_live)
      assert html =~ "Schedule updated successfully"
    end

    test "deletes schedule in listing", %{conn: conn, schedule: schedule} do
      {:ok, index_live, _html} = live(conn, ~p"/schedules")

      assert index_live |> element("#schedules-#{schedule.id} a", "Delete") |> render_click()
      refute has_element?(index_live, "#schedules-#{schedule.id}")
    end
  end

  describe "Show" do
    setup [:create_schedule]

    test "displays schedule", %{conn: conn, schedule: schedule} do
      {:ok, _show_live, html} = live(conn, ~p"/schedules/#{schedule}")

      assert html =~ "Show Schedule"
    end

    test "updates schedule within modal", %{conn: conn, schedule: schedule} do
      {:ok, show_live, _html} = live(conn, ~p"/schedules/#{schedule}")

      assert show_live |> element("a", "Edit") |> render_click() =~
               "Edit Schedule"

      assert_patch(show_live, ~p"/schedules/#{schedule}/show/edit")

      assert show_live
             |> form("#schedule-form", schedule: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert show_live
             |> form("#schedule-form", schedule: @update_attrs)
             |> render_submit()

      assert_patch(show_live, ~p"/schedules/#{schedule}")

      html = render(show_live)
      assert html =~ "Schedule updated successfully"
    end
  end
end
