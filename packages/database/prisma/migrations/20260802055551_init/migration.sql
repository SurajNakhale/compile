-- CreateEnum
CREATE TYPE "Language" AS ENUM ('CPP', 'JS', 'TS', 'PY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEED');

-- CreateTable
CREATE TABLE "submission" (
    "id" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "status" "Status" NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "compileOutput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);
