import { z } from "zod";

const createTreeNodeSchema = z.object({
  name: z.string().min(1),
  parentId: z.number().int().nullable(), // null = root
});

export default createTreeNodeSchema;

