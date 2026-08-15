import { z } from "zod";
import { INTERESSES } from "@/lib/domain/types";

export const interessesSchema = z.array(z.enum(INTERESSES as [string, ...string[]]));
