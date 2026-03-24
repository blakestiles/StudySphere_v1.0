"use client";

import { useRef, useEffect, useState, type FC } from "react";

const raymarchedSceneShader = `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_planeHeight;
uniform float u_epsilon;
uniform float u_speed;

out vec4 fragColor;

float sdPlane(vec3 p, float h) {
  return p.y - h;
}

float mapScene(vec3 p) {
  return sdPlane(p, u_planeHeight);
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(u_epsilon, 0.0);
  return normalize(vec3(
    mapScene(p + e.xyy) - mapScene(p - e.xyy),
    mapScene(p + e.yxy) - mapScene(p - e.yxy),
    mapScene(p + e.yyx) - mapScene(p - e.yyx)
  ));
}

float rayMarch(vec3 ro, vec3 rd) {
  float d = 0.0;
  for (int i = 0; i < 100; i++) {
    vec3 p = ro + rd * d;
    float dist = mapScene(p);
    if (dist < u_epsilon || d > 20.0) break;
    d += dist;
  }
  return d;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, u_planeHeight + 1.5, -1.5);
  vec3 rd = normalize(vec3(uv, 1.0));

  float d = rayMarch(ro, rd);
  vec3 color = vec3(0.0);

  if (d < 20.0) {
    vec3 p = ro + rd * d;
    vec3 n = calcNormal(p);
    vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
    float diff = max(dot(n, lightDir), 0.0);

    float check = mod(floor(p.x) + floor(p.z - u_time * u_speed), 2.0);
    // Amber-tinted checker
    vec3 dark = vec3(0.08, 0.04, 0.01);
    vec3 light = vec3(0.45, 0.28, 0.08);
    vec3 mat = mix(dark, light, check);

    color = mat * diff;

    // Distance fog
    float fog = 1.0 - exp(-0.08 * d * d);
    color = mix(color, vec3(0.03, 0.02, 0.01), fog);
  }

  fragColor = vec4(color, 1.0);
}`;

export interface InfinitePlaneBgProps {
  planeHeight?: number;
  epsilon?: number;
  speed?: number;
  className?: string;
}

const InfinitePlaneBg: FC<InfinitePlaneBgProps> = ({
  planeHeight = 0,
  epsilon = 0.001,
  speed = 1,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      setError("WebGL2 not supported");
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        setError("Shader compile error");
        return null;
      }
      return sh;
    };

    const vsSrc = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, raymarchedSceneShader);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      setError("Program link error");
      return;
    }

    const posLoc = gl.getAttribLocation(program, "a_position");
    const resLoc = gl.getUniformLocation(program, "u_resolution")!;
    const timeLoc = gl.getUniformLocation(program, "u_time")!;
    const planeLoc = gl.getUniformLocation(program, "u_planeHeight")!;
    const epsLoc = gl.getUniformLocation(program, "u_epsilon")!;
    const speedLoc = gl.getUniformLocation(program, "u_speed")!;

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resize);
    resize();

    let rafId: number;
    const render = (t: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.enableVertexAttribArray(posLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t * 0.001);
      gl.uniform1f(planeLoc, planeHeight);
      gl.uniform1f(epsLoc, epsilon);
      gl.uniform1f(speedLoc, speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [planeHeight, epsilon, speed]);

  if (error) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: "#05050C" }}
    />
  );
};

export default InfinitePlaneBg;
