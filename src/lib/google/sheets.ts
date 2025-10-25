import { google } from "googleapis";

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not set");
  }
  const parsed = JSON.parse(credentials);
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

export async function createSheet(
  title: string,
  headers: string[],
  folderId?: string
) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  // Create spreadsheet
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        {
          properties: { title: "Leads" },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                      backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Move to folder if specified
  if (folderId) {
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      fields: "id, parents",
    });
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function appendRows(spreadsheetId: string, values: string[][]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Leads!A:Z",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}
