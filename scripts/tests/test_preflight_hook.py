import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import preflight_hook  # noqa: E402


class PushDirectoryTests(unittest.TestCase):
    def test_ignores_commands_that_do_not_push(self) -> None:
        for command in (
            "sleep 5",
            'gh pr view 322 --json state --jq ".state"',
            'echo "$(git rev-parse HEAD)"',
            "git log --oneline -1",
            "echo git push",
            "git commit -m 'git push later'",
            "git commit -m 'first line\ngit push'",
        ):
            with self.subTest(command=command):
                self.assertEqual([], preflight_hook.push_directories(command, "/repo"))

    def test_finds_the_pushed_worktree(self) -> None:
        cases = {
            "git push -u origin main": "/repo",
            "git -C /work/tree push origin HEAD": "/work/tree",
            "git -c core.hooksPath=x push": "/repo",
            "cd web && git push": "/repo/web",
            "uv run pytest && git push --force-with-lease": "/repo",
            "git status\ngit push": "/repo",
            "(cd /other && git status); git push": "/repo",
            "(cd /other && git push)": "/other",
            "cd web\n\ngit push origin HEAD": "/repo/web",
            'GIT_SSH_COMMAND="ssh -i ~/.ssh/work" git push': "/repo",
        }
        for command, expected in cases.items():
            with self.subTest(command=command):
                self.assertEqual(
                    [Path(expected)], preflight_hook.push_directories(command, "/repo")
                )

    def test_reports_every_push_of_a_compound_command(self) -> None:
        self.assertEqual(
            [Path("/work/clean"), Path("/work/changed")],
            preflight_hook.push_directories(
                "cd /work/clean && git push; cd /work/changed && git push", "/repo"
            ),
        )

    def test_expands_variables_like_bash(self) -> None:
        with mock.patch.dict(preflight_hook.os.environ, {"WORKTREE": "/work/tree"}):
            self.assertEqual(
                [Path("/work/tree")],
                preflight_hook.push_directories('cd "$WORKTREE" && git push', "/repo"),
            )


class MainTests(unittest.TestCase):
    def run_hook(self, payload: dict) -> tuple[int, str, mock.MagicMock]:
        stdout = io.StringIO()
        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            mock.patch.object(sys, "stdout", stdout),
            mock.patch.object(preflight_hook.subprocess, "run") as run,
        ):
            run.side_effect = [
                mock.Mock(stdout="/work/tree\n", returncode=0),
                mock.Mock(returncode=1),
            ]
            code = preflight_hook.main()
        return code, stdout.getvalue(), run

    def test_other_commands_never_start_preflight(self) -> None:
        code, output, run = self.run_hook(
            {"tool_input": {"command": "sleep 1"}, "cwd": "/repo"}
        )
        self.assertEqual((0, ""), (code, output))
        run.assert_not_called()

    def test_failed_preflight_in_the_pushed_worktree_denies_the_push(self) -> None:
        code, output, run = self.run_hook(
            {"tool_input": {"command": "git -C /work/tree push"}, "cwd": "/repo"}
        )
        self.assertEqual(0, code)
        self.assertEqual(
            "deny", json.loads(output)["hookSpecificOutput"]["permissionDecision"]
        )
        preflight_call = run.call_args_list[1]
        self.assertEqual(["/work/tree/scripts/preflight.sh"], preflight_call.args[0])
        self.assertEqual("/work/tree", preflight_call.kwargs["cwd"])

    def test_unresolvable_directory_falls_back_to_the_session_worktree(self) -> None:
        stdout = io.StringIO()
        payload = {
            "tool_input": {"command": 'cd "$(pick)" && git push'},
            "cwd": "/repo",
        }
        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            mock.patch.object(sys, "stdout", stdout),
            mock.patch.object(preflight_hook.subprocess, "run") as run,
        ):
            run.side_effect = [
                preflight_hook.subprocess.CalledProcessError(128, "git"),
                mock.Mock(stdout="/repo\n", returncode=0),
                mock.Mock(returncode=1),
            ]
            self.assertEqual(0, preflight_hook.main())
        self.assertEqual(["/repo/scripts/preflight.sh"], run.call_args_list[2].args[0])
        self.assertIn("deny", stdout.getvalue())

    def test_any_failing_worktree_denies_a_multi_worktree_push(self) -> None:
        stdout = io.StringIO()
        payload = {
            "tool_input": {"command": "git -C /a push; git -C /b push"},
            "cwd": "/repo",
        }
        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            mock.patch.object(sys, "stdout", stdout),
            mock.patch.object(preflight_hook.subprocess, "run") as run,
        ):
            run.side_effect = [
                mock.Mock(stdout="/a\n", returncode=0),
                mock.Mock(stdout="/b\n", returncode=0),
                mock.Mock(returncode=0),
                mock.Mock(returncode=1),
            ]
            self.assertEqual(0, preflight_hook.main())
        self.assertEqual(
            [["/a/scripts/preflight.sh"], ["/b/scripts/preflight.sh"]],
            [call.args[0] for call in run.call_args_list[2:]],
        )
        self.assertIn("deny", stdout.getvalue())


if __name__ == "__main__":
    unittest.main()
