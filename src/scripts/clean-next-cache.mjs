import { rmSync } from "node:fs";
import { join } from "node:path";

for (const folder of ["cache"]) {
  rmSync(join(process.cwd(), ".next", folder), {
    force: true,
    recursive: true,
  });
}
