// src/routes/api/og/shared/[code]/+server.ts
import { error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { RequestHandler } from './$types';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { html } from 'satori-html';
import fs from 'fs';
import path from 'path';

async function loadFontAsArrayBuffer(fontPath) {
  const filePath = path.resolve(fontPath);
  return fs.promises.readFile(filePath);
}

export const GET: RequestHandler = async ({ params }) => {
  try {
    const shareCode = params.code;
    
    if (!shareCode) {
      throw error(400, 'Share code is required');
    }
    
    const [regularFont, boldFont] = await Promise.all([
      loadFontAsArrayBuffer('static/fonts/nunito-latin-300-normal.ttf'),
      loadFontAsArrayBuffer('static/fonts/nunito-latin-800-normal.ttf')
    ]);
    
    const sharedMeal = await prisma.sharedMeal.findUnique({
      where: { shareCode },
      include: {
        meal: {
          include: {
            ingredients: {
              include: { ingredient: true },
              take: 4
            }
          }
        },
        creator: {
          select: { username: true }
        }
      }
    });
    
    if (!sharedMeal) {
      throw error(404, 'Shared meal not found');
    }
    
    const { meal, creator } = sharedMeal;
    
    const ingredientList = meal.ingredients
      .map(ing => `${ing.amount} ${ing.ingredient.unit} ${ing.ingredient.name}`)
      .join(", ");
    
    const totalTime = meal.totalTime;
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    const timeString = hours > 0 
      ? `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
      : `${minutes}m`;
    
    const template = html`
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          fontSize: 32,
          fontWeight: 600,
          color: 'white',
          padding: 40,
          borderRadius: 16,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            fontSize: 20,
            color: '#ff9500',
            fontWeight: 700
          }}
        >
          Plate Pilot
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '20px 40px',
            backgroundColor: '#2a2a2a',
            borderRadius: 12,
            marginTop: 30
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>
            ${meal.name}
          </div>
          
          <div style={{ fontSize: 20, marginBottom: 10, textAlign: 'center', color: '#aaa' }}>
            ${meal.ingredients.length} ingredients • ${timeString} • ${meal.portions} portions
          </div>
          
          <div style={{ fontSize: 16, color: '#ddd', textAlign: 'center', marginTop: 10 }}>
            ${ingredientList}${meal.ingredients.length > 4 ? ` and ${meal.ingredients.length - 4} more` : ''}
          </div>
        </div>
        
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            fontSize: 16,
            color: '#aaa'
          }}
        >
          Shared by ${creator.username}
        </div>
      </div>
    `;

    const svg = await satori(template, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Nunito',
          data: regularFont,
          weight: 300,
          style: 'normal',
        },
        {
          name: 'Nunito',
          data: boldFont,
          weight: 800,
          style: 'normal',
        },
      ],
    });
    
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    
    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
  } catch (e) {
    console.error('Error generating OG image:', e);
    
    throw error(500, 'Failed to generate image');
  }
};