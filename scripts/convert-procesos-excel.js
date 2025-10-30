import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ID del nodo raíz "Conductor"
const CONDUCTOR_ROOT_ID = '9966E38A-FD26-4183-A8FF-2D2247B94110';

// Leer el archivo Excel
const workbook = XLSX.readFile(path.join(__dirname, '../procesos.xlsx'));
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const allData = XLSX.utils.sheet_to_json(worksheet);

console.log(`📊 Total de registros leídos: ${allData.length}`);

// Filtrar solo nodos activos
const activeNodes = allData.filter(node => node.isActivo === 1);
console.log(`✅ Nodos activos: ${activeNodes.length}`);

// Crear un mapa de nodos por ID para búsqueda rápida
const nodesMap = new Map(activeNodes.map(n => [n.id, n]));

// Función recursiva para recolectar todos los descendientes de un nodo
const collectDescendants = (nodeId) => {
  const node = nodesMap.get(nodeId);
  if (!node) return null;

  // Crear copia del nodo
  const nodeWithChildren = {
    id: node.id,
    nombre: node.nombre,
    tipo: node.tipo,
    orden: node.orden,
    isActivo: node.isActivo
  };

  // Solo incluir idPadre si existe
  if (node.idPadre) {
    nodeWithChildren.idPadre = node.idPadre;
  }

  // Buscar todos los hijos directos
  const children = activeNodes
    .filter(n => n.idPadre === nodeId)
    .map(child => collectDescendants(child.id))
    .filter(Boolean)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  if (children.length > 0) {
    nodeWithChildren.children = children;
  }

  return nodeWithChildren;
};

// Obtener la jerarquía completa del nodo Conductor
console.log(`🔍 Filtrando jerarquía desde ID: ${CONDUCTOR_ROOT_ID}`);
const conductorHierarchy = collectDescendants(CONDUCTOR_ROOT_ID);

if (!conductorHierarchy) {
  console.error('❌ ERROR: No se encontró el nodo Conductor con el ID especificado');
  process.exit(1);
}

// Contar total de nodos en la jerarquía filtrada
const countNodes = (node) => {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return count;
};

const totalNodesInHierarchy = countNodes(conductorHierarchy);
console.log(`📦 Nodos en la jerarquía de Conductor: ${totalNodesInHierarchy}`);

// Crear el directorio de destino si no existe
const outputDir = path.join(__dirname, '../assets/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Directorio creado: ${outputDir}`);
}

// Guardar el JSON
const outputPath = path.join(outputDir, 'procesos-conductor.json');
fs.writeFileSync(outputPath, JSON.stringify([conductorHierarchy], null, 2), 'utf-8');

console.log(`✅ Archivo generado exitosamente: ${outputPath}`);
console.log(`\n📋 Resumen:`);
console.log(`   - Nodo raíz: ${conductorHierarchy.nombre}`);
console.log(`   - Total nodos: ${totalNodesInHierarchy}`);
console.log(`   - Archivo: procesos-conductor.json`);
