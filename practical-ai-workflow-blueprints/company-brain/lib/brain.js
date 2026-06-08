import { 
  VectorStoreIndex, 
  storageContextFromDefaults, 
  Settings
} from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";
import fs from "fs/promises";
import path from "path";

// Configure OpenAI LLM and Embedding Model
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
});

const embedModel = new OpenAIEmbedding({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});

Settings.llm = openai;
Settings.embedModel = embedModel;

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_DIR = path.join(DATA_DIR, "storage");
const MARKDOWN_DIR = path.join(DATA_DIR, "markdown");
const GRAPH_DATA_PATH = path.join(DATA_DIR, "graph.json");

export async function getIndex() {
  const storageContext = await storageContextFromDefaults({
    persistDir: STORAGE_DIR,
  });

  try {
    const index = await VectorStoreIndex.init({
      storageContext,
    });
    return index;
  } catch (e) {
    const reader = new SimpleDirectoryReader();
    const documents = await reader.loadData({ directoryPath: MARKDOWN_DIR });
    const index = await VectorStoreIndex.fromDocuments(documents, {
      storageContext,
    });
    return index;
  }
}

export async function queryBrain(query) {
  const index = await getIndex();
  const queryEngine = index.asQueryEngine();
  const response = await queryEngine.query({ query });
  return response.toString();
}

async function extractEntities(text) {
  try {
    const prompt = `Analyze the following text and extract key entities. Return ONLY a JSON object with three arrays: "people", "tools", and "processes".
    
    Text: ${text.substring(0, 4000)}
    
    JSON format: { "people": [], "tools": [], "processes": [] }`;

    const response = await openai.chat({
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.message.content);
  } catch (error) {
    console.error("Entity extraction failed:", error);
    return { people: [], tools: [], processes: [] };
  }
}

export async function getGraphData() {
  try {
    const data = await fs.readFile(GRAPH_DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { nodes: [], edges: [] };
  }
}

export async function ingestFiles() {
  const reader = new SimpleDirectoryReader();
  const documents = await reader.loadData({ directoryPath: path.join(DATA_DIR, "raw") });
  
  if (documents.length === 0) return 0;

  let graphNodes = [];
  
  for (const doc of documents) {
    const fileName = path.basename(doc.id_ || `doc_${Date.now()}`);
    const mdFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const mdPath = path.join(MARKDOWN_DIR, mdFileName);
    
    const content = `# Source: ${fileName}\n\n${doc.text}`;
    await fs.writeFile(mdPath, content);
    
    const entities = await extractEntities(doc.text);
    
    graphNodes.push({
      id: mdFileName,
      name: fileName,
      type: "Document",
      entities: entities,
      lastSync: new Date().toISOString()
    });
  }

  await fs.writeFile(GRAPH_DATA_PATH, JSON.stringify({ nodes: graphNodes }, null, 2));

  const storageContext = await storageContextFromDefaults({
    persistDir: STORAGE_DIR,
  });
  
  const index = await VectorStoreIndex.fromDocuments(documents, {
    storageContext,
  });
  
  return documents.length;
}
