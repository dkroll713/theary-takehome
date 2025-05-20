import { z } from "zod";

const createTreeNodeSchema = z.object({
  label: z.string().min(1), // root node must have label "root"
  parentId: z.number().int() // 0 is root
});

export default createTreeNodeSchema;

