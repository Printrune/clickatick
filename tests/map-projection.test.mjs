import test from 'node:test';
import assert from 'node:assert/strict';
import {worldPoint,geoPoint,mapBounds,MIN_ZOOM,MAX_ZOOM} from '../lib/map-projection.mjs';
import {parseBounds} from '../lib/event-map.mjs';

test('map projection returns the original location after a pixel round trip',()=>{
  for(const [lat,lng] of [[40.7128,-74.006],[34.0522,-118.2437],[21.3099,-157.8581],[61.2181,-149.9003]]){
    for(const zoom of [MIN_ZOOM,MAX_ZOOM]){
      const point=worldPoint(lat,lng,zoom),result=geoPoint(point.x,point.y,zoom);
      assert.ok(Math.abs(result.lat-lat)<1e-9);
      assert.ok(Math.abs(result.lng-lng)<1e-9);
    }
  }
});

test('city-scale map view stays within the bounded backend contract',()=>{
  const centers=[[40.7128,-74.006],[21.3099,-157.8581],[61.2181,-149.9003]];
  for(const [lat,lng] of centers)for(const zoom of [MIN_ZOOM,MAX_ZOOM]){
    const bounds=parseBounds(mapBounds({lat,lng},1200,590,zoom));
    assert.ok(bounds.radius<=200);
  }
});

test('panning changes center while preserving valid latitude and longitude',()=>{
  const start=worldPoint(40.7128,-74.006,MIN_ZOOM);
  const moved=geoPoint(start.x+500,start.y+300,MIN_ZOOM);
  assert.ok(moved.lng>-74.006);
  assert.ok(moved.lat<40.7128);
  assert.ok(Number.isFinite(moved.lat)&&Number.isFinite(moved.lng));
});
