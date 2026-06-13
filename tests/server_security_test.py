import unittest
from unittest.mock import patch

from fastapi import HTTPException

import server


class ServerSecurityTests(unittest.TestCase):
    def test_filename_removes_paths_and_non_pdf_extension(self):
        self.assertEqual(server.safe_filename("../../КП:склад.exe"), "КП_склад.exe.pdf")

    def test_drive_url_allows_only_google_https_hosts(self):
        self.assertEqual(
            server.safe_drive_url("https://drive.google.com/file/d/abc/view"),
            "https://drive.google.com/file/d/abc/view",
        )
        self.assertIsNone(server.safe_drive_url("javascript:alert(1)"))
        self.assertIsNone(server.safe_drive_url("https://drive.google.com.evil.example/file"))
        self.assertIsNone(server.safe_drive_url("http://drive.google.com/file"))

    def test_authorization_requires_configured_matching_token(self):
        with patch.object(server, "UPLOAD_TOKEN", ""):
            with self.assertRaises(HTTPException) as missing:
                server.authorize(None)
            self.assertEqual(missing.exception.status_code, 503)

        with patch.object(server, "UPLOAD_TOKEN", "expected"):
            with self.assertRaises(HTTPException) as rejected:
                server.authorize("Bearer wrong")
            self.assertEqual(rejected.exception.status_code, 401)
            server.authorize("Bearer expected")

    def test_month_folder_is_found_or_created_below_configured_root(self):
        with (
            patch.object(server, "DRIVE_ROOT_FOLDER_ID", "root-folder-id"),
            patch.object(server, "BUSINESS_TIMEZONE", "Asia/Yekaterinburg"),
            patch.object(
                server,
                "run_google_command",
                side_effect=[
                    [],
                    {"status": "created", "id": "month-folder-id", "name": "2099-01"},
                ],
            ) as command,
            patch.object(server, "datetime") as mocked_datetime,
        ):
            mocked_datetime.now.return_value.strftime.return_value = "2099-01"
            self.assertEqual(server.resolve_month_folder(), "month-folder-id")
            search_arguments = command.call_args_list[0].args[0]
            create_arguments = command.call_args_list[1].args[0]
            self.assertIn("'root-folder-id' in parents", search_arguments[2])
            self.assertEqual(
                create_arguments,
                ["drive", "create-folder", "2099-01", "--parent", "root-folder-id"],
            )


if __name__ == "__main__":
    unittest.main()
