import Papa from "papaparse";
import { z } from "zod";

const ClientRowSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  tags: z.string().optional(),
});

export type ClientRow = z.infer<typeof ClientRowSchema>;

export interface ParsedCSVResult {
  data: ClientRow[];
  errors: Array<{ row: number; message: string }>;
}

export async function parseCSV(csvText: string): Promise<ParsedCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const normalized = header.toLowerCase().trim().replace(/\s+/g, "");
        const mapping: Record<string, string> = {
          firstname: "firstName",
          first_name: "firstName",
          "first name": "firstName",
          lastname: "lastName",
          last_name: "lastName",
          "last name": "lastName",
          companyname: "company",
          company_name: "company",
          phonenumber: "phone",
          phone_number: "phone",
          address: "address1",
          addressline1: "address1",
          address_line_1: "address1",
          addressline2: "address2",
          address_line_2: "address2",
          zip: "postalCode",
          zipcode: "postalCode",
          postal_code: "postalCode",
          tag: "tags",
        };

        return mapping[normalized] || normalized;
      },
      complete: (results) => {
        const data: ClientRow[] = [];
        const errors: Array<{ row: number; message: string }> = [];
        const seen = new Set<string>();

        results.data.forEach((row: unknown, index: number) => {
          try {
            const parsed = ClientRowSchema.parse(row);

            if (seen.has(parsed.email)) {
              errors.push({ row: index + 2, message: `Duplicate email: ${parsed.email}` });
              return;
            }

            seen.add(parsed.email);
            data.push(parsed);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push({
                row: index + 2,
                message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
              });
            }
          }
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [{ row: 0, message: error.message }],
        });
      },
    });
  });
}
