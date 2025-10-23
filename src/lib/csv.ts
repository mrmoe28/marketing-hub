import Papa from "papaparse";
import { z } from "zod";

// Known/standard fields that map to Client model columns
const KNOWN_FIELDS = [
  "email",
  "firstName",
  "lastName",
  "company",
  "phone",
  "address1",
  "address2",
  "city",
  "state",
  "postalCode",
  "country",
  "tags",
];

const ClientRowSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email format"),
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
}).passthrough(); // Allow extra fields to pass through

export type ClientRow = z.infer<typeof ClientRowSchema> & Record<string, unknown>;

export interface ParsedCSVResult {
  data: ClientRow[];
  errors: Array<{ row: number; message: string }>;
  customFields?: string[]; // List of fields not in standard schema
}

// Transform data values for specific fields
function transformFieldValue(fieldName: string, value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const normalizedFieldName = fieldName.toLowerCase().replace(/[_\s-]/g, "");
  const strValue = String(value).trim();

  // System size conversion: 7110 → "7.1 kW"
  if (
    normalizedFieldName.includes("systemsize") ||
    normalizedFieldName.includes("size") ||
    normalizedFieldName.includes("capacity") ||
    normalizedFieldName === "systemsize" ||
    normalizedFieldName === "size"
  ) {
    // Try to parse as number (handle watts)
    const numValue = parseFloat(strValue.replace(/[^0-9.]/g, ""));
    if (!isNaN(numValue) && numValue > 100) {
      // Likely in watts, convert to kW
      const kw = numValue / 1000;
      return `${kw.toFixed(1)} kW`;
    }
    // If already small number, assume it's kW
    if (!isNaN(numValue) && numValue <= 100) {
      return `${numValue.toFixed(1)} kW`;
    }
  }

  // Energy production formatting: Add kWh suffix if it's a number
  if (
    normalizedFieldName.includes("energyproduced") ||
    normalizedFieldName.includes("production") ||
    normalizedFieldName.includes("generated")
  ) {
    const numValue = parseFloat(strValue.replace(/[^0-9.]/g, ""));
    if (!isNaN(numValue)) {
      // If value > 1000, assume Wh and convert to kWh
      if (numValue > 1000) {
        return `${(numValue / 1000).toFixed(2)} kWh`;
      }
      // Already in kWh
      return `${numValue.toFixed(2)} kWh`;
    }
  }

  // Status normalization: Capitalize first letter
  if (
    normalizedFieldName.includes("status") ||
    normalizedFieldName === "status"
  ) {
    return strValue.charAt(0).toUpperCase() + strValue.slice(1).toLowerCase();
  }

  return value;
}

export async function parseCSV(csvText: string): Promise<ParsedCSVResult> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const normalized = header.toLowerCase().trim().replace(/\s+/g, "");
        const mapping: Record<string, string> = {
          // Email variations
          owneremail: "email",
          owner_email: "email",
          customeremail: "email",
          customer_email: "email",
          clientemail: "email",
          client_email: "email",
          emailaddress: "email",
          email_address: "email",
          "e-mail": "email",

          // Name variations
          firstname: "firstName",
          first_name: "firstName",
          ownerfirstname: "firstName",
          customerfirstname: "firstName",
          owner: "firstName",  // If only "owner" exists, use as firstName
          lastname: "lastName",
          last_name: "lastName",
          ownerlastname: "lastName",
          customerlastname: "lastName",

          // Company variations
          companyname: "company",
          company_name: "company",
          organization: "company",

          // Phone variations
          phonenumber: "phone",
          phone_number: "phone",
          ownerphone: "phone",
          customerphone: "phone",
          telephone: "phone",
          mobile: "phone",
          cellphone: "phone",
          cell: "phone",
          contactnumber: "phone",

          // Address variations
          address: "address1",
          addressline1: "address1",
          address_line_1: "address1",
          streetaddress: "address1",
          street_address: "address1",
          street: "address1",
          addressline2: "address2",
          address_line_2: "address2",
          installationaddress: "address1",
          siteaddress: "address1",

          // Postal code variations
          zip: "postalCode",
          zipcode: "postalCode",
          postal_code: "postalCode",
          postalcode: "postalCode",
          "zip/postalcode": "postalCode",

          // State variations
          "state/prov": "state",
          province: "state",

          // Tags
          tag: "tags",
        };

        return mapping[normalized] || normalized;
      },
      complete: (results) => {
        const data: ClientRow[] = [];
        const errors: Array<{ row: number; message: string }> = [];
        const seen = new Set<string>();
        const customFields: string[] = [];

        // Detect custom fields (fields not in known schema)
        if (results.meta?.fields) {
          const csvFields = results.meta.fields;
          customFields.push(
            ...csvFields.filter((field) => !KNOWN_FIELDS.includes(field))
          );
        }

        // Check if CSV has email column (after header transformation)
        const hasEmailColumn = results.meta?.fields?.includes("email");

        if (results.meta?.fields && !hasEmailColumn) {
          const availableFields = results.meta.fields.join(", ");
          errors.push({
            row: 0,
            message: `CSV must have an "email" column (or owneremail, customeremail, etc.). Found columns: ${availableFields}`,
          });
          resolve({ data: [], errors, customFields });
          return;
        }

        results.data.forEach((row: unknown, index: number) => {
          // Check if row is actually empty (all values are empty/null/undefined)
          const rowObj = row as Record<string, unknown>;
          const hasAnyData = Object.values(rowObj).some((val) =>
            val !== null && val !== undefined && String(val).trim() !== ""
          );

          // Skip completely empty rows silently
          if (!hasAnyData) {
            return;
          }

          try {
            // Apply transformations to row data before validation
            const rowObj = row as Record<string, unknown>;
            const transformedRow: Record<string, unknown> = {};

            Object.keys(rowObj).forEach((key) => {
              transformedRow[key] = transformFieldValue(key, rowObj[key]);
            });

            const parsed = ClientRowSchema.parse(transformedRow);

            if (seen.has(parsed.email)) {
              errors.push({ row: index + 2, message: `Duplicate email: ${parsed.email}` });
              return;
            }

            seen.add(parsed.email);
            data.push(parsed as ClientRow);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push({
                row: index + 2,
                message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
              });
            }
          }
        });

        resolve({ data, errors, customFields: customFields.length > 0 ? customFields : undefined });
      },
      error: (error: Error) => {
        resolve({
          data: [],
          errors: [{ row: 0, message: error.message }],
        });
      },
    });
  });
}
