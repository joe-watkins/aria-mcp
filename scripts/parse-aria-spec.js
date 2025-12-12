#!/usr/bin/env node
/**
 * ARIA Specification Parser
 * Extracts roles, states, properties, and other ARIA data from the W3C ARIA specification HTML
 * and generates a comprehensive JSON file for the MCP server.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const ariaDir = path.join(dataDir, 'aria');

/**
 * Clean text by removing excess whitespace and normalizing
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Parse roles from the main ARIA spec
 */
function parseRoles($) {
  const roles = {};
  
  // Find all role definitions
  $('div.role').each((_, roleDiv) => {
    const $role = $(roleDiv);
    const id = $role.attr('id');
    if (!id) return;
    
    const role = {
      name: id,
      description: cleanText($role.find('.role-description').text()),
      isAbstract: false,
      superclassRoles: [],
      subclassRoles: [],
      relatedConcepts: [],
      requiredContextRole: [],
      requiredOwnedElements: [],
      requiredStates: [],
      supportedStates: [],
      inheritedStates: [],
      prohibitedStates: [],
      nameFrom: [],
      accessibleNameRequired: false,
      childrenPresentational: false,
      implicitValueForRole: {},
    };
    
    // Parse characteristics table
    $role.find('table.def tbody tr, table.def tr').each((_, row) => {
      const $row = $(row);
      const header = cleanText($row.find('th').text()).toLowerCase();
      const $value = $row.find('td');
      const value = cleanText($value.text());
      
      if (header.includes('superclass')) {
        role.superclassRoles = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('subclass')) {
        role.subclassRoles = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('related concept')) {
        role.relatedConcepts = $value.find('a, code').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('required context')) {
        role.requiredContextRole = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('required owned') || header.includes('required children')) {
        role.requiredOwnedElements = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('required state') || header.includes('required properties')) {
        role.requiredStates = $value.find('sref, pref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('supported state') || header.includes('supported properties')) {
        role.supportedStates = $value.find('sref, pref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('inherited state')) {
        role.inheritedStates = $value.find('sref, pref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('prohibited state') || header.includes('prohibited properties')) {
        role.prohibitedStates = $value.find('sref, pref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('name from')) {
        role.nameFrom = value.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      } else if (header.includes('accessible name required')) {
        role.accessibleNameRequired = value.toLowerCase() === 'true';
      } else if (header.includes('children are presentational') || header.includes('children presentational')) {
        role.childrenPresentational = value.toLowerCase() === 'true';
      } else if (header.includes('is abstract')) {
        role.isAbstract = value.toLowerCase() === 'true';
      } else if (header.includes('implicit value')) {
        // Parse implicit values like "aria-live: assertive"
        const matches = value.match(/([a-z-]+)\s*:\s*([^;,]+)/gi);
        if (matches) {
          matches.forEach(match => {
            const [prop, val] = match.split(':').map(s => s.trim());
            role.implicitValueForRole[prop] = val;
          });
        }
      }
    });
    
    roles[id] = role;
  });
  
  return roles;
}

/**
 * Parse states and properties from the main ARIA spec
 */
function parseStatesAndProperties($) {
  const attributes = {};
  
  // Find all state and property definitions
  $('div.state, div.property').each((_, attrDiv) => {
    const $attr = $(attrDiv);
    const id = $attr.attr('id');
    if (!id) return;
    
    const isState = $attr.hasClass('state');
    
    const attr = {
      name: id,
      type: isState ? 'state' : 'property',
      description: cleanText($attr.find('.state-description, .property-description').first().text()),
      valueType: '',
      defaultValue: '',
      applicableRoles: [],
      inheritedIntoRoles: [],
      relatedConcepts: [],
      values: [],
      isGlobal: false,
    };
    
    // Parse characteristics table
    $attr.find('table.def tbody tr, table.def tr').each((_, row) => {
      const $row = $(row);
      const header = cleanText($row.find('th').text()).toLowerCase();
      const $value = $row.find('td');
      const value = cleanText($value.text());
      
      if (header.includes('value type') || header.includes('value')) {
        attr.valueType = value;
        // Extract enum values if present
        const enumMatches = value.match(/token(?:s)?\s*:?\s*([^|]+(?:\|[^|]+)*)/i);
        if (enumMatches) {
          attr.values = enumMatches[1].split('|').map(v => v.trim()).filter(Boolean);
        }
      } else if (header.includes('default')) {
        attr.defaultValue = value;
      } else if (header.includes('used in role') || header.includes('applicable to')) {
        attr.applicableRoles = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
        if (value.toLowerCase().includes('all elements')) {
          attr.isGlobal = true;
        }
      } else if (header.includes('inherited into')) {
        attr.inheritedIntoRoles = $value.find('rref, a').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      } else if (header.includes('related concept')) {
        attr.relatedConcepts = $value.find('a, code').map((_, el) => cleanText($(el).text())).get().filter(Boolean);
      }
    });
    
    attributes[id] = attr;
  });
  
  return attributes;
}

/**
 * Parse the roleInfo.js file for additional role details
 */
function parseRoleInfoJS() {
  const roleInfoPath = path.join(ariaDir, 'common', 'script', 'roleInfo.js');
  if (!fs.existsSync(roleInfoPath)) {
    console.warn('roleInfo.js not found, skipping');
    return {};
  }
  
  const content = fs.readFileSync(roleInfoPath, 'utf-8');
  // Extract JSON from the JS file
  const jsonMatch = content.match(/var roleInfo = (\{[\s\S]*\});?\s*$/);
  if (!jsonMatch) {
    console.warn('Could not parse roleInfo.js');
    return {};
  }
  
  try {
    // Use Function constructor to safely evaluate the JSON-like object
    return new Function('return ' + jsonMatch[1])();
  } catch (e) {
    console.warn('Error parsing roleInfo.js:', e.message);
    return {};
  }
}

/**
 * Build complete property list for a role by inheriting from parent roles
 */
function buildAllProps(roleName, roleInfo, visited = new Set()) {
  if (visited.has(roleName)) return [];
  visited.add(roleName);
  
  const role = roleInfo[roleName];
  if (!role) return [];
  
  // Start with role's own allprops if available, otherwise localprops
  let props = role.allprops ? [...role.allprops] : (role.localprops ? [...role.localprops] : []);
  
  // If no allprops, inherit from parent roles
  if (!role.allprops && role.parentRoles) {
    for (const parentName of role.parentRoles) {
      const parentProps = buildAllProps(parentName, roleInfo, visited);
      // Add parent props that aren't already in our list
      for (const parentProp of parentProps) {
        if (!props.find(p => p.name === parentProp.name)) {
          props.push(parentProp);
        }
      }
    }
  }
  
  return props;
}

/**
 * Parse AccName spec for accessible name computation
 */
function parseAccName() {
  const accnamePath = path.join(ariaDir, 'accname', 'index.html');
  if (!fs.existsSync(accnamePath)) {
    console.warn('accname/index.html not found');
    return null;
  }
  
  const html = fs.readFileSync(accnamePath, 'utf-8');
  const $ = cheerio.load(html);
  
  return {
    title: cleanText($('title').text()) || 'Accessible Name and Description Computation',
    abstract: cleanText($('#abstract').text()),
    specUrl: 'https://w3c.github.io/accname/',
  };
}

/**
 * Parse HTML-AAM for HTML element to role mappings
 */
function parseHtmlAam() {
  const htmlAamPath = path.join(ariaDir, 'html-aam', 'index.html');
  if (!fs.existsSync(htmlAamPath)) {
    console.warn('html-aam/index.html not found');
    return {};
  }
  
  const html = fs.readFileSync(htmlAamPath, 'utf-8');
  const $ = cheerio.load(html);
  
  const mappings = {};
  
  // Find mapping tables
  $('table').each((_, table) => {
    const $table = $(table);
    const caption = cleanText($table.find('caption').text());
    
    if (caption.toLowerCase().includes('html element') || caption.toLowerCase().includes('role mapping')) {
      $table.find('tbody tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td, th');
        if (cells.length >= 2) {
          const element = cleanText($(cells[0]).text());
          const role = cleanText($(cells[1]).text());
          if (element && role) {
            mappings[element] = {
              element,
              implicitRole: role,
            };
          }
        }
      });
    }
  });
  
  return mappings;
}

/**
 * Parse DPUB-ARIA for digital publishing roles
 */
function parseDpubAria() {
  const dpubPath = path.join(ariaDir, 'dpub-aria', 'index.html');
  if (!fs.existsSync(dpubPath)) {
    console.warn('dpub-aria/index.html not found');
    return {};
  }
  
  const html = fs.readFileSync(dpubPath, 'utf-8');
  const $ = cheerio.load(html);
  
  const roles = {};
  
  $('div.role').each((_, roleDiv) => {
    const $role = $(roleDiv);
    const id = $role.attr('id');
    if (!id) return;
    
    roles[id] = {
      name: id,
      module: 'dpub-aria',
      description: cleanText($role.find('.role-description').text()),
    };
  });
  
  return roles;
}

/**
 * Parse Graphics-ARIA for graphics roles
 */
function parseGraphicsAria() {
  const graphicsPath = path.join(ariaDir, 'graphics-aria', 'index.html');
  if (!fs.existsSync(graphicsPath)) {
    console.warn('graphics-aria/index.html not found');
    return {};
  }
  
  const html = fs.readFileSync(graphicsPath, 'utf-8');
  const $ = cheerio.load(html);
  
  const roles = {};
  
  $('div.role').each((_, roleDiv) => {
    const $role = $(roleDiv);
    const id = $role.attr('id');
    if (!id) return;
    
    roles[id] = {
      name: id,
      module: 'graphics-aria',
      description: cleanText($role.find('.role-description').text()),
    };
  });
  
  return roles;
}

/**
 * Categorize roles by their type
 */
function categorizeRoles(roles) {
  const categories = {
    abstract: [],
    widget: [],
    document: [],
    landmark: [],
    liveRegion: [],
    window: [],
    composite: [],
  };
  
  // Abstract roles
  const abstractRoleNames = [
    'roletype', 'structure', 'widget', 'window', 'input', 'range', 'command',
    'composite', 'section', 'sectionhead', 'select', 'landmark'
  ];
  
  // Widget roles
  const widgetRoleNames = [
    'button', 'checkbox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'option', 'progressbar', 'radio', 'scrollbar', 'searchbox',
    'separator', 'slider', 'spinbutton', 'switch', 'tab', 'tabpanel', 'textbox',
    'treeitem'
  ];
  
  // Composite widget roles
  const compositeRoleNames = [
    'combobox', 'grid', 'listbox', 'menu', 'menubar', 'radiogroup', 'tablist',
    'tree', 'treegrid'
  ];
  
  // Document structure roles
  const documentRoleNames = [
    'application', 'article', 'blockquote', 'caption', 'cell', 'code',
    'columnheader', 'definition', 'deletion', 'directory', 'document', 'emphasis',
    'feed', 'figure', 'generic', 'group', 'heading', 'img', 'insertion', 'list',
    'listitem', 'math', 'meter', 'none', 'note', 'paragraph', 'presentation',
    'row', 'rowgroup', 'rowheader', 'strong', 'subscript', 'superscript',
    'table', 'term', 'time', 'toolbar', 'tooltip'
  ];
  
  // Landmark roles
  const landmarkRoleNames = [
    'banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation',
    'region', 'search'
  ];
  
  // Live region roles
  const liveRegionRoleNames = ['alert', 'log', 'marquee', 'status', 'timer'];
  
  // Window roles
  const windowRoleNames = ['alertdialog', 'dialog'];
  
  Object.keys(roles).forEach(roleName => {
    const role = roles[roleName];
    
    if (role.isAbstract || abstractRoleNames.includes(roleName)) {
      categories.abstract.push(roleName);
      role.category = 'abstract';
    } else if (landmarkRoleNames.includes(roleName)) {
      categories.landmark.push(roleName);
      role.category = 'landmark';
    } else if (liveRegionRoleNames.includes(roleName)) {
      categories.liveRegion.push(roleName);
      role.category = 'liveRegion';
    } else if (windowRoleNames.includes(roleName)) {
      categories.window.push(roleName);
      role.category = 'window';
    } else if (compositeRoleNames.includes(roleName)) {
      categories.composite.push(roleName);
      role.category = 'composite';
    } else if (widgetRoleNames.includes(roleName)) {
      categories.widget.push(roleName);
      role.category = 'widget';
    } else {
      categories.document.push(roleName);
      role.category = 'document';
    }
  });
  
  return categories;
}

/**
 * Main function to parse all ARIA specs and generate JSON
 */
async function main() {
  console.log('Parsing ARIA Specification...\n');
  
  // Read main ARIA spec
  const ariaHtmlPath = path.join(ariaDir, 'index.html');
  if (!fs.existsSync(ariaHtmlPath)) {
    console.error('ARIA index.html not found at:', ariaHtmlPath);
    process.exit(1);
  }
  
  const ariaHtml = fs.readFileSync(ariaHtmlPath, 'utf-8');
  const $ = cheerio.load(ariaHtml);
  
  // Parse main components
  console.log('Parsing roles...');
  const roles = parseRoles($);
  console.log(`  Found ${Object.keys(roles).length} roles`);
  
  console.log('Parsing states and properties...');
  const statesAndProperties = parseStatesAndProperties($);
  const states = {};
  const properties = {};
  
  Object.entries(statesAndProperties).forEach(([name, attr]) => {
    if (attr.type === 'state') {
      states[name] = attr;
    } else {
      properties[name] = attr;
    }
  });
  console.log(`  Found ${Object.keys(states).length} states`);
  console.log(`  Found ${Object.keys(properties).length} properties`);
  
  // Parse roleInfo.js for detailed role-attribute mappings
  console.log('Parsing roleInfo.js...');
  const roleInfo = parseRoleInfoJS();
  console.log(`  Found ${Object.keys(roleInfo).length} role entries`);
  
  // Merge roleInfo data into roles
  Object.entries(roleInfo).forEach(([roleName, info]) => {
    if (roles[roleName]) {
      roles[roleName].parentRoles = info.parentRoles || [];
      roles[roleName].localProps = info.localprops || [];
      // Build complete allProps by inheriting from parent roles
      roles[roleName].allProps = buildAllProps(roleName, roleInfo);
    }
  });
  
  // Categorize roles
  console.log('Categorizing roles...');
  const categories = categorizeRoles(roles);
  
  // Parse related specs
  console.log('Parsing AccName...');
  const accname = parseAccName();
  
  console.log('Parsing HTML-AAM...');
  const htmlMappings = parseHtmlAam();
  console.log(`  Found ${Object.keys(htmlMappings).length} HTML element mappings`);
  
  console.log('Parsing DPUB-ARIA...');
  const dpubRoles = parseDpubAria();
  console.log(`  Found ${Object.keys(dpubRoles).length} DPUB roles`);
  
  console.log('Parsing Graphics-ARIA...');
  const graphicsRoles = parseGraphicsAria();
  console.log(`  Found ${Object.keys(graphicsRoles).length} Graphics roles`);
  
  // Build the complete data structure
  const ariaData = {
    metadata: {
      version: '1.3',
      generatedAt: new Date().toISOString(),
      sourceUrl: 'https://github.com/w3c/aria',
      specUrl: 'https://w3c.github.io/aria/',
    },
    roles,
    roleCategories: categories,
    states,
    properties,
    globalStatesAndProperties: Object.keys(statesAndProperties)
      .filter(name => statesAndProperties[name].isGlobal)
      .sort(),
    htmlMappings,
    extensions: {
      dpub: dpubRoles,
      graphics: graphicsRoles,
    },
    accname,
    serverInfo: {
      name: 'aria-mcp',
      version: '1.0.0',
      description: 'ARIA specification MCP server for accessibility professionals and AI agents',
    },
  };
  
  // Write output
  const outputPath = path.join(dataDir, 'aria-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(ariaData, null, 2));
  console.log(`\nGenerated ${outputPath}`);
  
  // Also update content.json to point to aria-data.json
  console.log('Done!');
}

main().catch(console.error);

