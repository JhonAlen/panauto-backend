const { request } = require('express');
const sql = require('mssql');

const config = {
    user: process.env.USER_BD,
    password: process.env.PASSWORD_BD,
    server: process.env.SERVER_BD,
    database: process.env.NAME_BD,
}

function changeDateFormat(date) {
    let newDateFormat = date.split("/");
    return newDateFormat[2] + '-' + newDateFormat[1] + '-' + newDateFormat[0]
}

module.exports = {
    authQuery: async(xemail) =>{
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xemail', sql.NVarChar, xemail)
                .input('bactivo', sql.Bit, true)
                .query('select * from VWAUTENTICACIONUSUARIO where XEMAIL = @xemail and BACTIVO = @bactivo');
            return { result: result };
        }
        catch(err){

            return { error: err.message};
        }
    },
    createAuthErrorQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .query('select * from COERRORCONTRASENA where CUSUARIO = @cusuario');
            if(result.rowsAffected > 0){
                let nintento = result.recordset[0].NINTENTO + 1;
                let update = await pool.request()
                    .input('cusuario', sql.Int, cusuario)
                    .input('nintento', sql.Int, nintento)
                    .query('update COERRORCONTRASENA set NINTENTO = @nintento where CUSUARIO = @cusuario');
                //sql.close();
                return { result: update, attempt: nintento };
            }else{
                let create = await pool.request()
                    .input('cusuario', sql.Int, cusuario)
                    .input('nintento', sql.Int, 1)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into COERRORCONTRASENA (CUSUARIO, NINTENTO, FCREACION) values (@cusuario, @nintento, @fcreacion)');
                //sql.close();
                return { result: create, attempt: 1 };
            }
        }
        catch(err){
            return { error: err.message};
        }
    },
    deleteAuthErrorQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .query('delete from COERRORCONTRASENA where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message };
        }
    },
    blockUserQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('bactivo', sql.Bit, false)
                .input('fmodificacion', sql.DateTime, new Date())
                .input('cusuariomodificacion', sql.Int, cusuario)
                .query('update SEUSUARIO set BACTIVO = @bactivo, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message};
        }
    },
    validateSignInQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .query('select * from BIINGRESO where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createPasswordChangeQuery: async(cusuario, ccambiocontrasena) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('bactivo', sql.Bit, true)
                .query('select * from COCAMBIOCONTRASENA where CUSUARIO = @cusuario and BACTIVO = @bactivo')
            if(result.rowsAffected > 0){
                for(let i = 0; i < result.recordset.length; i++){
                    await pool.request()
                        .input('ccambiocontrasena', sql.NVarChar, result.recordset[i].CCAMBIOCONTRASENA)
                        .input('bactivo', sql.Bit, false)
                        .query('update COCAMBIOCONTRASENA set BACTIVO = @bactivo where CCAMBIOCONTRASENA = @ccambiocontrasena')
                }
            }
            let create = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('bactivo', sql.Bit, true)
                .input('ccambiocontrasena', sql.NVarChar, ccambiocontrasena)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into COCAMBIOCONTRASENA (CCAMBIOCONTRASENA, CUSUARIO, BACTIVO, FCREACION) values (@ccambiocontrasena, @cusuario, @bactivo, @fcreacion)')
            //sql.close();
            return { result: create };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createSignInQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into BIINGRESO (CUSUARIO, FCREACION) values (@cusuario, @fcreacion)');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message };
        }
    },
    countryValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select CPAIS, XPAIS, BACTIVO from MAPAIS WHERE BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    companyValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from MACOMPANIA');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    departmentValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select CDEPARTAMENTO, XDEPARTAMENTO, BACTIVO from SEDEPARTAMENTO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    roleValrepQuery: async(cdepartamento) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdepartamento', sql.Int, cdepartamento)
                .query('select CROL, XROL, BACTIVO from SEROL where CDEPARTAMENTO = @cdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyUserEmailToCreateQuery: async(xemail) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xemail', sql.NVarChar, xemail)
                .query('select * from SEUSUARIO where XEMAIL = @xemail');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyUserEmailToUpdateQuery: async(cusuario, xemail) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xemail', sql.NVarChar, xemail)
                .input('cusuario', sql.Int, cusuario)
                .query('select * from SEUSUARIO where XEMAIL = @xemail and CUSUARIO != @cusuario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchUserQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARUSUARIODATA where CUSUARIO != 0${ searchData.cpais ? ' and CPAIS = @cpais' : '' }${ searchData.ccompania ? ' and CCOMPANIA = @ccompania' : '' }${ searchData.cdepartamento ? ' and CDEPARTAMENTO = @cdepartamento' : '' }${ searchData.crol ? ' and CROL = @crol' : '' }${ searchData.xnombre ? ' and XNOMBRE = @xnombre' : '' }${ searchData.xapellido ? ' and XAPELLIDO = @xapellido' : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('cdepartamento', sql.Int, searchData.cdepartamento ? searchData.cdepartamento : 1)
                .input('crol', sql.Int, searchData.crol ? searchData.crol : 1)
                .input('xnombre', sql.NVarChar, searchData.xnombre ? searchData.xnombre : 'TEST')
                .input('xapellido', sql.NVarChar, searchData.xapellido ? searchData.xapellido : 'TEST')
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createUserQuery: async(userData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xnombre', sql.NVarChar, userData.xnombre)
                .input('xapellido', sql.NVarChar, userData.xapellido)
                .input('xemail', sql.NVarChar, userData.xemail)
                .input('xtelefono', sql.NVarChar, userData.xtelefono)
                .input('xdireccion', sql.NVarChar, userData.xdireccion)
                .input('xcontrasena', sql.NVarChar, userData.xcontrasena)
                .input('bproveedor', sql.Bit, userData.bproveedor)
                .input('bactivo', sql.Bit, userData.bactivo)
                .input('cproveedor', sql.Int, userData.cproveedor ? userData.cproveedor : null)
                .input('cpais', sql.Numeric(4, 0), userData.cpais)
                .input('ccompania', sql.Int, userData.ccompania)
                .input('cdepartamento', sql.Int, userData.cdepartamento)
                .input('crol', sql.Int, userData.crol)
                .input('ccanal', sql.Int, userData.ccanal)
                .input('ccorredor', sql.Int, userData.ccorredor)
                .input('bcorredor', sql.Bit, userData.bcorredor)
                .input('cusuariocreacion', sql.Int, userData.cusuariocreacion)
                .input('ctipo_sistema', sql.Int, 2)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into SEUSUARIO (XNOMBRE, XAPELLIDO, XEMAIL, XTELEFONO, XDIRECCION, XCONTRASENA, BPROVEEDOR, BACTIVO, CPROVEEDOR, CPAIS, CCOMPANIA, CDEPARTAMENTO, CROL, BCORREDOR, CCORREDOR, CUSUARIOCREACION, FCREACION, CTIPO_SISTEMA, CCANAL) values (@xnombre, @xapellido, @xemail, @xtelefono, @xdireccion, @xcontrasena, @bproveedor, @bactivo, @cproveedor, @cpais, @ccompania, @cdepartamento, @crol, @bcorredor, @ccorredor, @cusuariocreacion, @fcreacion, @ctipo_sistema, @ccanal)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xemail', sql.NVarChar, userData.xemail)
                    .query('select * from SEUSUARIO where XEMAIL = @xemail');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getUserDataQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .query('select * from SEUSUARIO where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateUserQuery: async(userData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, userData.cusuario)
                .input('xnombre', sql.NVarChar, userData.xnombre)
                .input('xapellido', sql.NVarChar, userData.xapellido)
                .input('xemail', sql.NVarChar, userData.xemail)
                .input('xtelefono', sql.NVarChar, userData.xtelefono)
                .input('xdireccion', sql.NVarChar, userData.xdireccion)
                .input('bproveedor', sql.Bit, userData.bproveedor)
                .input('bactivo', sql.Bit, userData.bactivo)
                .input('cpais', sql.Numeric(4, 0), userData.cpais)
                .input('ccompania', sql.Int, userData.ccompania)
                .input('cdepartamento', sql.Int, userData.cdepartamento)
                .input('crol', sql.Int, userData.crol)
                .input('ccanal', sql.Int, userData.ccanal)
                .input('cproveedor', sql.Int, userData.cproveedor)
                .input('cusuariomodificacion', sql.Int, userData.cusuariomodificacion)
                .input('ccorredor', sql.Int, userData.ccorredor)
                .input('bcorredor', sql.Bit, userData.bcorredor)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update SEUSUARIO set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, XEMAIL = @xemail, XTELEFONO = @xtelefono, XDIRECCION = @xdireccion, BPROVEEDOR = @bproveedor, BACTIVO = @bactivo, CPAIS = @cpais, CCOMPANIA = @ccompania, CDEPARTAMENTO = @cdepartamento, CROL = @crol, CPROVEEDOR = @cproveedor, BCORREDOR = @bcorredor, CCORREDOR = @ccorredor, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, CCANAL = @ccanal where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateUserPasswordQuery: async(cusuario, xcontrasena) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('xcontrasena', sql.NVarChar, xcontrasena)
                .input('cusuariomodificacion', sql.Int, cusuario)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update SEUSUARIO set XCONTRASENA = @xcontrasena, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion where CUSUARIO = @cusuario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyChangePasswordTokenQuery: async(ccambiocontrasena) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccambiocontrasena', sql.NChar, ccambiocontrasena)
                .input('bactivo', sql.Bit, true)
                .query('select * from COCAMBIOCONTRASENA where CCAMBIOCONTRASENA = @ccambiocontrasena and BACTIVO = @bactivo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateChangePasswordTokenQuery:  async(ccambiocontrasena) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccambiocontrasena', sql.NChar, ccambiocontrasena)
                .input('bactivo', sql.Bit, false)
                .query('update COCAMBIOCONTRASENA set BACTIVO = @bactivo where CCAMBIOCONTRASENA = @ccambiocontrasena');
            //sql.close();
            return { result: result }; 
        }catch(err){
            return { error: err.message };
        }
    },
    searchModulesQuery: async(cusuario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, cusuario)
                .input('bactivo', sql.Bit, true)
                .query('select * from VWMODULOSXUSUARIO where CUSUARIO = @cusuario and BACTIVO = @bactivo ORDER BY XRUTA , XMODULO');
            //sql.close();
            return { result: result }; 
        }catch(err){
            return { error: err.message };
        }
    },
    searchCountryQuery: async(searchData) => {
        try{
            let query = `select * from MAPAIS where CPAIS != 0${ searchData.cpais ? ' and CPAIS = @cpais' : '' }${ searchData.xpais ? " and XPAIS like '%" + searchData.xpais + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCountryCodeToCreateQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select * from MAPAIS where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCountryNameToCreateQuery: async(xpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xpais', sql.NVarChar, xpais)
                .query('select * from MAPAIS where XPAIS = @xpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCountryQuery: async(countryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), countryData.cpais)
                .input('xpais', sql.NVarChar, countryData.xpais)
                .input('bactivo', sql.Bit, countryData.bactivo)
                .input('cusuariocreacion', sql.Int, countryData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAPAIS (CPAIS, XPAIS, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @xpais, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), countryData.cpais)
                    .query('select * from MAPAIS where CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCountryDataQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select * from MAPAIS where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCountryNameToUpdateQuery: async(cpais, xpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xpais', sql.NVarChar, xpais)
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select * from MAPAIS where XPAIS = @xpais and CPAIS != @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCountryQuery: async(countryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), countryData.cpais)
                .input('xpais', sql.NVarChar, countryData.xpais)
                .input('bactivo', sql.Bit, countryData.bactivo)
                .input('cusuariomodificacion', sql.Int, countryData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAPAIS set XPAIS = @xpais, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCompanyQuery: async(searchData) => {
        try{
            let query = `select * from MACOMPANIA where CCOMPANIA != 0${ searchData.xcompania ? " and XCOMPANIA like '%" + searchData.xcompania + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCompanyNameToCreateQuery: async(xcompania) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcompania', sql.NVarChar, xcompania)
                .query('select * from MACOMPANIA where XCOMPANIA = @xcompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCompanyQuery: async(companyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcompania', sql.NVarChar, companyData.xcompania)
                .input('xcolornav', sql.NChar, companyData.xcolornav)
                .input('xtemanav', sql.NVarChar, companyData.xtemanav)
                .input('xcolorprimario', sql.NChar, companyData.xcolorprimario)
                .input('xcolorsegundario', sql.NChar, companyData.xcolorsegundario)
                .input('xcolorterciario', sql.NChar, companyData.xcolorterciario)
                .input('xcolortexto', sql.NChar, companyData.xcolortexto)
                .input('bactivo', sql.Bit, companyData.bactivo)
                .input('cusuariocreacion', sql.Int, companyData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACOMPANIA (XCOMPANIA, XCOLORNAV, XTEMANAV, XCOLORPRIMARIO, XCOLORSEGUNDARIO, XCOLORTERCIARIO, XCOLORTEXTO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@xcompania, @xcolornav, @xtemanav, @xcolorprimario, @xcolorsegundario, @xcolorterciario, @xcolortexto, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xcompania', sql.NVarChar, companyData.xcompania)
                    .query('select * from MACOMPANIA where XCOMPANIA = @xcompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCompanyDataQuery: async(ccompania) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, ccompania)
                .query('select * from MACOMPANIA where CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCompanyNameToUpdateQuery: async(ccompania, xcompania) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcompania', sql.NVarChar, xcompania)
                .input('ccompania', sql.Int, ccompania)
                .query('select * from MACOMPANIA where XCOMPANIA = @xcompania and CCOMPANIA != @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCompanyQuery: async(companyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, companyData.ccompania)
                .input('xcompania', sql.NVarChar, companyData.xcompania)
                .input('xcolornav', sql.NChar, companyData.xcolornav)
                .input('xtemanav', sql.NVarChar, companyData.xtemanav)
                .input('xcolorprimario', sql.NChar, companyData.xcolorprimario)
                .input('xcolorsegundario', sql.NChar, companyData.xcolorsegundario)
                .input('xcolorterciario', sql.NChar, companyData.xcolorterciario)
                .input('xcolortexto', sql.NChar, companyData.xcolortexto)
                .input('bactivo', sql.Bit, companyData.bactivo)
                .input('cusuariomodificacion', sql.Int, companyData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACOMPANIA set XCOMPANIA = @xcompania, XCOLORNAV = @xcolornav, XTEMANAV = @xtemanav, XCOLORPRIMARIO = @xcolorprimario, XCOLORSEGUNDARIO = @xcolorsegundario, XCOLORTERCIARIO = @xcolorterciario, XCOLORTEXTO = @xcolortexto, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDepartmentQuery: async(searchData) => {
        try{
            let query = `select * from SEDEPARTAMENTO where CDEPARTAMENTO != 0${ searchData.xdepartamento ? " and XDEPARTAMENTO like '%" + searchData.xdepartamento + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDepartmentNameToCreateQuery: async(xdepartamento) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdepartamento', sql.NVarChar, xdepartamento)
                .query('select * from SEDEPARTAMENTO where XDEPARTAMENTO = @xdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDepartmentQuery: async(departmentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdepartamento', sql.NVarChar, departmentData.xdepartamento)
                .input('bactivo', sql.Bit, departmentData.bactivo)
                .input('cusuariocreacion', sql.Int, departmentData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into SEDEPARTAMENTO (XDEPARTAMENTO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@xdepartamento, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xdepartamento', sql.NVarChar, departmentData.xdepartamento)
                    .query('select * from SEDEPARTAMENTO where XDEPARTAMENTO = @xdepartamento');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getDepartmentDataQuery: async(cdepartamento) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdepartamento', sql.Int, cdepartamento)
                .query('select * from SEDEPARTAMENTO where CDEPARTAMENTO = @cdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDepartmentNameToUpdateQuery: async(cdepartamento, xdepartamento) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdepartamento', sql.NVarChar, xdepartamento)
                .input('cdepartamento', sql.Int, cdepartamento)
                .query('select * from SEDEPARTAMENTO where XDEPARTAMENTO = @xdepartamento and CDEPARTAMENTO != @cdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateDepartmentQuery: async(departmentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdepartamento', sql.Int, departmentData.cdepartamento)
                .input('xdepartamento', sql.NVarChar, departmentData.xdepartamento)
                .input('bactivo', sql.Bit, departmentData.bactivo)
                .input('cusuariomodificacion', sql.Int, departmentData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update SEDEPARTAMENTO set XDEPARTAMENTO = @xdepartamento, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDEPARTAMENTO = @cdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    validateModulePermissionQuery: async(validationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cusuario', sql.Int, validationData.cusuario)
                .input('cmodulo', sql.Int, validationData.cmodulo)
                .query('select * from VWPERMISOSXUSUARIO where CUSUARIO = @cusuario and CMODULO = @cmodulo');
            //sql.close();
            return { result: result }; 
        }catch(err){
            return { error: err.message };
        }
    },
    searchGroupQuery: async(searchData) => {
        try{
            let query = `select * from SEGRUPO where CGRUPO != 0${ searchData.xgrupo ? " and XGRUPO like '%" + searchData.xgrupo + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyGroupNameToCreateQuery: async(xgrupo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xgrupo', sql.NVarChar, xgrupo)
                .query('select * from SEGRUPO where XGRUPO = @xgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createGroupQuery: async(groupData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xgrupo', sql.NVarChar, groupData.xgrupo)
                .input('bactivo', sql.Bit, groupData.bactivo)
                .input('cusuariocreacion', sql.Int, groupData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into SEGRUPO (XGRUPO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@xgrupo, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xgrupo', sql.NVarChar, groupData.xgrupo)
                    .query('select * from SEGRUPO where XGRUPO = @xgrupo');
                if(query.rowsAffected > 0){
                    for(let i = 0; i < groupData.modules.length; i++){
                        let insert = await pool.request()
                            .input('cgrupo', sql.Int, query.recordset[0].CGRUPO)
                            .input('xmodulo', sql.NVarChar, groupData.modules[i].xmodulo)
                            .input('xruta', sql.NVarChar, groupData.modules[i].xruta)
                            .input('bactivo', sql.Bit, groupData.modules[i].bactivo)
                            .input('cusuariocreacion', sql.Int, groupData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into SEMODULO (CGRUPO, XMODULO, XRUTA, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cgrupo, @xmodulo, @xruta, @bactivo, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getGroupDataQuery: async(cgrupo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cgrupo', sql.Int, cgrupo)
                .query('select * from SEGRUPO where CGRUPO = @cgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getModulesDataQuery: async(cgrupo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cgrupo', sql.Int, cgrupo)
                .query('select * from SEMODULO where CGRUPO = @cgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createModulesByGroupUpdateQuery: async(modules, groupData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let insert = await pool.request()
                    .input('cgrupo', sql.Int, groupData.cgrupo)
                    .input('xmodulo', sql.NVarChar, modules[i].xmodulo)
                    .input('xruta', sql.NVarChar, modules[i].xruta)
                    .input('bactivo', sql.Bit, modules[i].bactivo)
                    .input('cusuariocreacion', sql.Int, groupData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into SEMODULO (CGRUPO, XMODULO, XRUTA, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cgrupo, @xmodulo, @xruta, @bactivo, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateModulesByGroupUpdateQuery: async(modules, groupData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let update = await pool.request()
                    .input('cgrupo', sql.Int, groupData.cgrupo)
                    .input('cmodulo', sql.Int, modules[i].cmodulo)
                    .input('xmodulo', sql.NVarChar, modules[i].xmodulo)
                    .input('xruta', sql.NVarChar, modules[i].xruta)
                    .input('bactivo', sql.Bit, groupData.bactivo)
                    .input('cusuariomodificacion', sql.Int, groupData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update SEMODULO set XMODULO = @xmodulo, XRUTA = @xruta, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CGRUPO = @cgrupo and CMODULO = @cmodulo');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteModulesByGroupUpdateQuery: async(modules, groupData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let erase = await pool.request()
                    .input('cgrupo', sql.Int, groupData.cgrupo)
                    .input('cmodulo', sql.Int, modules[i].cmodulo)
                    .query('delete from SEMODULO where CGRUPO = @cgrupo and CMODULO = @cmodulo');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    verifyGroupNameToUpdateQuery: async(cgrupo, xgrupo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xgrupo', sql.NVarChar, xgrupo)
                .input('cgrupo', sql.Int, cgrupo)
                .query('select * from SEGRUPO where XGRUPO = @xgrupo and CGRUPO != @cgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateGroupQuery: async(groupData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cgrupo', sql.Int, groupData.cgrupo)
                .input('xgrupo', sql.NVarChar, groupData.xgrupo)
                .input('bactivo', sql.Bit, groupData.bactivo)
                .input('cusuariomodificacion', sql.Int, groupData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update SEGRUPO set XGRUPO = @xgrupo, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CGRUPO = @cgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchRoleQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARROLDATA where CROL != 0${ searchData.cdepartamento ? ' and CDEPARTAMENTO = @cdepartamento' : '' }${ searchData.xrol ? " and XROL like '%" + searchData.xrol + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdepartamento', sql.Int, searchData.cdepartamento ? searchData.cdepartamento : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRoleNameToCreateQuery: async(xrol, cdepartamento) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xrol', sql.NVarChar, xrol)
                .input('cdepartamento', sql.Int, cdepartamento)
                .query('select * from SEROL where XROL = @xrol and CDEPARTAMENTO = @cdepartamento');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createRoleQuery: async(roleData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdepartamento', sql.Int, roleData.cdepartamento)
                .input('xrol', sql.NVarChar, roleData.xrol)
                .input('bactivo', sql.Bit, roleData.bactivo)
                .input('cusuariocreacion', sql.Int, roleData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into SEROL (CDEPARTAMENTO, XROL, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cdepartamento, @xrol, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cdepartamento', sql.Int, roleData.cdepartamento)
                    .input('xrol', sql.NVarChar, roleData.xrol)
                    .query('select * from SEROL where XROL = @xrol and CDEPARTAMENTO = @cdepartamento');
                if(query.rowsAffected > 0){
                    for(let i = 0; i < roleData.permissions.length; i++){
                        let insert = await pool.request()
                            .input('crol', sql.Int, query.recordset[0].CROL)
                            .input('cgrupo', sql.Int, roleData.permissions[i].cgrupo)
                            .input('cmodulo', sql.Int, roleData.permissions[i].cmodulo)
                            .input('bindice', sql.Bit, roleData.permissions[i].bindice)
                            .input('bcrear', sql.Bit, roleData.permissions[i].bcrear)
                            .input('bdetalle', sql.Bit, roleData.permissions[i].bdetalle)
                            .input('beditar', sql.Bit, roleData.permissions[i].beditar)
                            .input('beliminar', sql.Bit, roleData.permissions[i].beliminar)
                            .input('cusuariocreacion', sql.Int, roleData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into SEPERMISO (CROL, CGRUPO, CMODULO, BINDICE, BCREAR, BDETALLE, BEDITAR, BELIMINAR, CUSUARIOCREACION, FCREACION) values (@crol, @cgrupo, @cmodulo, @bindice, @bcrear, @bdetalle, @beditar, @beliminar, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getRoleDataQuery: async(crol) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crol', sql.Int, crol)
                .query('select * from SEROL where CROL = @crol');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getPermissionsDataQuery: async(crol) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crol', sql.Int, crol)
                .query('select * from VWBUSCARPERMISOSXROLDATA where CROL = @crol');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRoleNameToUpdateQuery: async(roleData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crol', sql.Int, roleData.crol)
                .input('xrol', sql.NVarChar, roleData.xrol)
                .input('cdepartamento', sql.Int, roleData.cdepartamento)
                .query('select * from SEROL where XROL = @xrol and CDEPARTAMENTO = @cdepartamento and CROL != @crol');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateRoleQuery: async(roleData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crol', sql.Int, roleData.crol)
                .input('cdepartamento', sql.Int, roleData.cdepartamento)
                .input('xrol', sql.NVarChar, roleData.xrol)
                .input('bactivo', sql.Bit, roleData.bactivo)
                .input('cusuariomodificacion', sql.Int, roleData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update SEROL set CDEPARTAMENTO = @cdepartamento, XROL = @xrol, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CROL = @crol');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createPermissionsByRoleUpdateQuery: async(permissions, roleData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < permissions.length; i++){
                let insert = await pool.request()
                    .input('crol', sql.Int, roleData.crol)
                    .input('cgrupo', sql.Int, permissions[i].cgrupo)
                    .input('cmodulo', sql.Int, permissions[i].cmodulo)
                    .input('bindice', sql.Bit, permissions[i].bindice)
                    .input('bcrear', sql.Bit, permissions[i].bcrear)
                    .input('bdetalle', sql.Bit, permissions[i].bdetalle)
                    .input('beditar', sql.Bit, permissions[i].beditar)
                    .input('beliminar', sql.Bit, permissions[i].beliminar)
                    .input('cusuariocreacion', sql.Int, roleData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into SEPERMISO (CROL, CGRUPO, CMODULO, BINDICE, BCREAR, BDETALLE, BEDITAR, BELIMINAR, CUSUARIOCREACION, FCREACION) values (@crol, @cgrupo, @cmodulo, @bindice, @bcrear, @bdetalle, @beditar, @beliminar, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updatePermissionsByRoleUpdateQuery: async(permissions, roleData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < permissions.length; i++){
                let update = await pool.request()
                    .input('crol', sql.Int, roleData.crol)
                    .input('cgrupo', sql.Int, permissions[i].cgrupo)
                    .input('cmodulo', sql.Int, permissions[i].cmodulo)
                    .input('bindice', sql.Bit, permissions[i].bindice)
                    .input('bcrear', sql.Bit, permissions[i].bcrear)
                    .input('bdetalle', sql.Bit, permissions[i].bdetalle)
                    .input('beditar', sql.Bit, permissions[i].beditar)
                    .input('beliminar', sql.Bit, permissions[i].beliminar)
                    .input('cusuariomodificacion', sql.Int, roleData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update SEPERMISO set BINDICE = @bindice, BCREAR = @bcrear, BDETALLE = @bdetalle, BEDITAR = @beditar, BELIMINAR = @beliminar, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CGRUPO = @cgrupo and CMODULO = @cmodulo and CROL = @crol');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deletePermissionsByRoleUpdateQuery: async(permissions, roleData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < permissions.length; i++){
                let erase = await pool.request()
                    .input('crol', sql.Int, roleData.crol)
                    .input('cgrupo', sql.Int, permissions[i].cgrupo)
                    .input('cmodulo', sql.Int, permissions[i].cmodulo)
                    .query('delete from SEPERMISO where CGRUPO = @cgrupo and CMODULO = @cmodulo and CROL = @crol');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    groupValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select CGRUPO, XGRUPO, BACTIVO from SEGRUPO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    moduleValrepQuery: async(cgrupo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cgrupo', sql.Int, cgrupo)
                .query('select CMODULO, XMODULO, BACTIVO from SEMODULO where CGRUPO = @cgrupo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchAccesoryQuery: async(searchData) => {
        try{
            let query = `select * from MAACCESORIO where CPAIS = @cpais${ searchData.xaccesorio ? " and XACCESORIO like '%" + searchData.xaccesorio + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAccesoryNameToCreateQuery: async(accesoryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                .input('xaccesorio', sql.NVarChar, accesoryData.xaccesorio)
                .query('select * from MAACCESORIO where XACCESORIO = @xaccesorio and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createAccesoryQuery: async(accesoryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xaccesorio', sql.NVarChar, accesoryData.xaccesorio)
                .input('bactivo', sql.Bit, accesoryData.bactivo)
                .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                .input('cusuariocreacion', sql.Int, accesoryData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAACCESORIO (XACCESORIO, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xaccesorio, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xaccesorio', sql.NVarChar, accesoryData.xaccesorio)
                    .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                    .query('select * from MAACCESORIO where XACCESORIO = @xaccesorio and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getAccesoryDataQuery: async(accesoryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                .input('caccesorio', sql.Int, accesoryData.caccesorio)
                .query('select * from MAACCESORIO where CPAIS = @cpais and CACCESORIO = @caccesorio');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAccesoryNameToUpdateQuery: async(accesoryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                .input('xaccesorio', sql.NVarChar, accesoryData.xaccesorio)
                .input('caccesorio', sql.Int, accesoryData.caccesorio)
                .query('select * from MAACCESORIO where XACCESORIO = @xaccesorio and CACCESORIO != @caccesorio and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateAccesoryQuery: async(accesoryData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), accesoryData.cpais)
                .input('caccesorio', sql.Int, accesoryData.caccesorio)
                .input('xaccesorio', sql.NVarChar, accesoryData.xaccesorio)
                .input('bactivo', sql.Bit, accesoryData.bactivo)
                .input('cusuariomodificacion', sql.Int, accesoryData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAACCESORIO set XACCESORIO = @xaccesorio, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CACCESORIO = @caccesorio and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchAssociateTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOASOCIADO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtipoasociado ? " and XTIPOASOCIADO like '%" + searchData.xtipoasociado + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAssociateTypeNameToCreateQuery: async(associateTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                .input('ccompania', sql.Int, associateTypeData.ccompania)
                .input('xtipoasociado', sql.NVarChar, associateTypeData.xtipoasociado)
                .query('select * from MATIPOASOCIADO where XTIPOASOCIADO = @xtipoasociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createAssociateTypeQuery: async(associateTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipoasociado', sql.NVarChar, associateTypeData.xtipoasociado)
                .input('bactivo', sql.Bit, associateTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                .input('ccompania', sql.Int, associateTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, associateTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOASOCIADO (XTIPOASOCIADO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtipoasociado, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipoasociado', sql.NVarChar, associateTypeData.xtipoasociado)
                    .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                    .input('ccompania', sql.Int, associateTypeData.ccompania)
                    .query('select * from MATIPOASOCIADO where XTIPOASOCIADO = @xtipoasociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getAssociateTypeDataQuery: async(associateTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                .input('ccompania', sql.Int, associateTypeData.ccompania)
                .input('ctipoasociado', sql.Int, associateTypeData.ctipoasociado)
                .query('select * from MATIPOASOCIADO where CPAIS = @cpais and CTIPOASOCIADO = @ctipoasociado and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAssociateTypeNameToUpdateQuery: async(associateTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                .input('ccompania', sql.Int, associateTypeData.ccompania)
                .input('xtipoasociado', sql.NVarChar, associateTypeData.xtipoasociado)
                .input('ctipoasociado', sql.Int, associateTypeData.ctipoasociado)
                .query('select * from MATIPOASOCIADO where XTIPOASOCIADO = @xtipoasociado and CTIPOASOCIADO != @ctipoasociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateAssociateTypeQuery: async(associateTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateTypeData.cpais)
                .input('ccompania', sql.Int, associateTypeData.ccompania)
                .input('ctipoasociado', sql.Int, associateTypeData.ctipoasociado)
                .input('xtipoasociado', sql.NVarChar, associateTypeData.xtipoasociado)
                .input('bactivo', sql.Bit, associateTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, associateTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOASOCIADO set XTIPOASOCIADO = @xtipoasociado, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOASOCIADO = @ctipoasociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchBankAccountTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOCUENTABANCARIA where CPAIS = @cpais${ searchData.xtipocuentabancaria ? " and XTIPOCUENTABANCARIA like '%" + searchData.xtipocuentabancaria + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBankAccountTypeNameToCreateQuery: async(bankAccountTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                .input('xtipocuentabancaria', sql.NVarChar, bankAccountTypeData.xtipocuentabancaria)
                .query('select * from MATIPOCUENTABANCARIA where XTIPOCUENTABANCARIA = @xtipocuentabancaria and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBankAccountTypeQuery: async(bankAccountTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipocuentabancaria', sql.NVarChar, bankAccountTypeData.xtipocuentabancaria)
                .input('bactivo', sql.Bit, bankAccountTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                .input('cusuariocreacion', sql.Int, bankAccountTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOCUENTABANCARIA (XTIPOCUENTABANCARIA, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xtipocuentabancaria, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipocuentabancaria', sql.NVarChar, bankAccountTypeData.xtipocuentabancaria)
                    .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                    .query('select * from MATIPOCUENTABANCARIA where XTIPOCUENTABANCARIA = @xtipocuentabancaria and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getBankAccountTypeDataQuery: async(bankAccountTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                .input('ctipocuentabancaria', sql.Int, bankAccountTypeData.ctipocuentabancaria)
                .query('select * from MATIPOCUENTABANCARIA where CPAIS = @cpais and CTIPOCUENTABANCARIA = @ctipocuentabancaria');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBankAccountTypeNameToUpdateQuery: async(bankAccountTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                .input('xtipocuentabancaria', sql.NVarChar, bankAccountTypeData.xtipocuentabancaria)
                .input('ctipocuentabancaria', sql.Int, bankAccountTypeData.ctipocuentabancaria)
                .query('select * from MATIPOCUENTABANCARIA where XTIPOCUENTABANCARIA = @xtipocuentabancaria and CTIPOCUENTABANCARIA != @ctipocuentabancaria and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateBankAccountTypeQuery: async(bankAccountTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankAccountTypeData.cpais)
                .input('ctipocuentabancaria', sql.Int, bankAccountTypeData.ctipocuentabancaria)
                .input('xtipocuentabancaria', sql.NVarChar, bankAccountTypeData.xtipocuentabancaria)
                .input('bactivo', sql.Bit, bankAccountTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, bankAccountTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOCUENTABANCARIA set XTIPOCUENTABANCARIA = @xtipocuentabancaria, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOCUENTABANCARIA = @ctipocuentabancaria and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchBankQuery: async(searchData) => {
        try{
            let query = `select * from MABANCO where CPAIS = @cpais${ searchData.xbanco ? " and XBANCO like '%" + searchData.xbanco + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBankNameToCreateQuery: async(bankData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                .input('xbanco', sql.NVarChar, bankData.xbanco)
                .query('select * from MABANCO where XBANCO = @xbanco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBankQuery: async(bankData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xbanco', sql.NVarChar, bankData.xbanco)
                .input('bactivo', sql.Bit, bankData.bactivo)
                .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                .input('cusuariocreacion', sql.Int, bankData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MABANCO (XBANCO, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xbanco, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xbanco', sql.NVarChar, bankData.xbanco)
                    .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                    .query('select * from MABANCO where XBANCO = @xbanco and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getBankDataDataQuery: async(bankData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                .input('cbanco', sql.Int, bankData.cbanco)
                .query('select * from MABANCO where CPAIS = @cpais and CBANCO = @cbanco');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBankNameToUpdateQuery: async(bankData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                .input('xbanco', sql.NVarChar, bankData.xbanco)
                .input('cbanco', sql.Int, bankData.cbanco)
                .query('select * from MABANCO where XBANCO = @xbanco and CBANCO != @cbanco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateBankQuery: async(bankData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), bankData.cpais)
                .input('cbanco', sql.Int, bankData.cbanco)
                .input('xbanco', sql.NVarChar, bankData.xbanco)
                .input('bactivo', sql.Bit, bankData.bactivo)
                .input('cusuariomodificacion', sql.Int, bankData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MABANCO set XBANCO = @xbanco, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CBANCO = @cbanco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchColorQuery: async(searchData) => {
        try{
            let query = `select * from MACOLOR where CPAIS = @cpais${ searchData.xcolor ? " and XCOLOR like '%" + searchData.xcolor + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyColorNameToCreateQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('xcolor', sql.NVarChar, colorData.xcolor)
                .query('select * from MACOLOR where XCOLOR = @xcolor and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createColorQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcolor', sql.NVarChar, colorData.xcolor)
                .input('bactivo', sql.Bit, colorData.bactivo)
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('cusuariocreacion', sql.Int, colorData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACOLOR (XCOLOR, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xcolor, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xcolor', sql.NVarChar, colorData.xcolor)
                    .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                    .query('select * from MACOLOR where XCOLOR = @xcolor and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getColorDataQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('ccolor', sql.Int, colorData.ccolor)
                .query('select * from MACOLOR where CPAIS = @cpais and CCOLOR = @ccolor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getColorDataQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('ccolor', sql.Int, colorData.ccolor)
                .query('select * from MACOLOR where CPAIS = @cpais and CCOLOR = @ccolor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyColorNameToUpdateQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('xcolor', sql.NVarChar, colorData.xcolor)
                .input('ccolor', sql.Int, colorData.ccolor)
                .query('select * from MACOLOR where XCOLOR = @xcolor and CCOLOR != @ccolor and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateColorQuery: async(colorData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), colorData.cpais)
                .input('ccolor', sql.Int, colorData.ccolor)
                .input('xcolor', sql.NVarChar, colorData.xcolor)
                .input('bactivo', sql.Bit, colorData.bactivo)
                .input('cusuariomodificacion', sql.Int, colorData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACOLOR set XCOLOR = @xcolor, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOLOR = @ccolor and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchServiceTypeQuery: async(searchData) => {
        try{
            let query = `select CTIPOSERVICIO, XTIPOSERVICIO from MATIPOSERVICIO where BACTIVO = 1${ searchData.xtiposervicio ? " and XTIPOSERVICIO = @xtiposervicio" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtiposervicio', sql.NVarChar, searchData.xtiposervicio ? searchData.xtiposervicio : undefined)
                .query(query);
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceTypeNameToCreateQuery: async(serviceTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                .input('ccompania', sql.Int, serviceTypeData.ccompania)
                .input('xtiposervicio', sql.NVarChar, serviceTypeData.xtiposervicio)
                .query('select * from MATIPOSERVICIO where XTIPOSERVICIO = @xtiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createServiceTypeQuery: async(serviceTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtiposervicio', sql.NVarChar, serviceTypeData.xtiposervicio)
                .input('bactivo', sql.Bit, serviceTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                .input('ccompania', sql.Int, serviceTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, serviceTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOSERVICIO (XTIPOSERVICIO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtiposervicio, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtiposervicio', sql.NVarChar, serviceTypeData.xtiposervicio)
                    .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                    .input('ccompania', sql.Int, serviceTypeData.ccompania)
                    .query('select * from MATIPOSERVICIO where XTIPOSERVICIO = @xtiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceTypeDataQuery: async(serviceTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                .input('ccompania', sql.Int, serviceTypeData.ccompania)
                .input('ctiposervicio', sql.Int, serviceTypeData.ctiposervicio)
                .query('select * from MATIPOSERVICIO where CPAIS = @cpais and CTIPOSERVICIO = @ctiposervicio and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceTypeNameToUpdateQuery: async(serviceTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                .input('ccompania', sql.Int, serviceTypeData.ccompania)
                .input('xtiposervicio', sql.NVarChar, serviceTypeData.xtiposervicio)
                .input('ctiposervicio', sql.Int, serviceTypeData.ctiposervicio)
                .query('select * from MATIPOSERVICIO where XTIPOSERVICIO = @xtiposervicio and CTIPOSERVICIO != @ctiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateServiceTypeQuery: async(serviceTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceTypeData.cpais)
                .input('ccompania', sql.Int, serviceTypeData.ccompania)
                .input('ctiposervicio', sql.Int, serviceTypeData.ctiposervicio)
                .input('xtiposervicio', sql.NVarChar, serviceTypeData.xtiposervicio)
                .input('bactivo', sql.Bit, serviceTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, serviceTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOSERVICIO set XTIPOSERVICIO = @xtiposervicio, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOSERVICIO = @ctiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPlanTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOPLAN where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtipoplan ? " and XTIPOPLAN like '%" + searchData.xtipoplan + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPlanTypeNameToCreateQuery: async(planTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                .input('ccompania', sql.Int, planTypeData.ccompania)
                .input('xtipoplan', sql.NVarChar, planTypeData.xtipoplan)
                .query('select * from MATIPOPLAN where XTIPOPLAN = @xtipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createPlanTypeQuery: async(planTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipoplan', sql.NVarChar, planTypeData.xtipoplan)
                .input('bactivo', sql.Bit, planTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                .input('ccompania', sql.Int, planTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, planTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOPLAN (XTIPOPLAN, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtipoplan, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipoplan', sql.NVarChar, planTypeData.xtipoplan)
                    .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                    .input('ccompania', sql.Int, planTypeData.ccompania)
                    .query('select * from MATIPOPLAN where XTIPOPLAN = @xtipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){

            return { error: err.message };
        }
    },
    getPlanTypeDataQuery: async(planTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                .input('ccompania', sql.Int, planTypeData.ccompania)
                .input('ctipoplan', sql.Int, planTypeData.ctipoplan)
                .query('select * from MATIPOPLAN where CPAIS = @cpais and CTIPOPLAN = @ctipoplan and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPlanTypeNameToUpdateQuery: async(planTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                .input('ccompania', sql.Int, planTypeData.ccompania)
                .input('xtipoplan', sql.NVarChar, planTypeData.xtipoplan)
                .input('ctipoplan', sql.Int, planTypeData.ctipoplan)
                .query('select * from MATIPOPLAN where XTIPOPLAN = @xtipoplan and CTIPOPLAN != @ctipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updatePlanTypeQuery: async(planTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planTypeData.cpais)
                .input('ccompania', sql.Int, planTypeData.ccompania)
                .input('ctipoplan', sql.Int, planTypeData.ctipoplan)
                .input('xtipoplan', sql.NVarChar, planTypeData.xtipoplan)
                .input('bactivo', sql.Bit, planTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, planTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOPLAN set XTIPOPLAN = @xtipoplan, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOPLAN = @ctipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchNotificationTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPONOTIFICACION where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtiponotificacion ? " and XTIPONOTIFICACION like '%" + searchData.xtiponotificacion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyNotificationTypeNameToCreateQuery: async(notificationTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                .input('ccompania', sql.Int, notificationTypeData.ccompania)
                .input('xtiponotificacion', sql.NVarChar, notificationTypeData.xtiponotificacion)
                .query('select * from MATIPONOTIFICACION where XTIPONOTIFICACION = @xtiponotificacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createNotificationTypeQuery: async(notificationTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtiponotificacion', sql.NVarChar, notificationTypeData.xtiponotificacion)
                .input('bactivo', sql.Bit, notificationTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                .input('ccompania', sql.Int, notificationTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, notificationTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPONOTIFICACION (XTIPONOTIFICACION, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtiponotificacion, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtiponotificacion', sql.NVarChar, notificationTypeData.xtiponotificacion)
                    .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                    .input('ccompania', sql.Int, notificationTypeData.ccompania)
                    .query('select * from MATIPONOTIFICACION where XTIPONOTIFICACION = @xtiponotificacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationTypeDataQuery: async(notificationTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                .input('ccompania', sql.Int, notificationTypeData.ccompania)
                .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                .query('select * from MATIPONOTIFICACION where CPAIS = @cpais and CTIPONOTIFICACION = @ctiponotificacion and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyNotificationTypeNameToUpdateQuery: async(notificationTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                .input('ccompania', sql.Int, notificationTypeData.ccompania)
                .input('xtiponotificacion', sql.NVarChar, notificationTypeData.xtiponotificacion)
                .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                .query('select * from MATIPONOTIFICACION where XTIPONOTIFICACION = @xtiponotificacion and CTIPONOTIFICACION != @ctiponotificacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateNotificationTypeQuery: async(notificationTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), notificationTypeData.cpais)
                .input('ccompania', sql.Int, notificationTypeData.ccompania)
                .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                .input('xtiponotificacion', sql.NVarChar, notificationTypeData.xtiponotificacion)
                .input('bactivo', sql.Bit, notificationTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, notificationTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPONOTIFICACION set XTIPONOTIFICACION = @xtiponotificacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPONOTIFICACION = @ctiponotificacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchInspectionTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOINSPECCION where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtipoinspeccion ? " and XTIPOINSPECCION like '%" + searchData.xtipoinspeccion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyInspectionTypeNameToCreateQuery: async(inspectionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                .input('xtipoinspeccion', sql.NVarChar, inspectionTypeData.xtipoinspeccion)
                .query('select * from MATIPOINSPECCION where XTIPOINSPECCION = @xtipoinspeccion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createInspectionTypeQuery: async(inspectionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipoinspeccion', sql.NVarChar, inspectionTypeData.xtipoinspeccion)
                .input('bactivo', sql.Bit, inspectionTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, inspectionTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOINSPECCION (XTIPOINSPECCION, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtipoinspeccion, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipoinspeccion', sql.NVarChar, inspectionTypeData.xtipoinspeccion)
                    .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                    .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                    .query('select * from MATIPOINSPECCION where XTIPOINSPECCION = @xtipoinspeccion and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getInspectionTypeDataQuery: async(inspectionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                .input('ctipoinspeccion', sql.Int, inspectionTypeData.ctipoinspeccion)
                .query('select * from MATIPOINSPECCION where CPAIS = @cpais and CTIPOINSPECCION = @ctipoinspeccion and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyInspectionTypeNameToUpdateQuery: async(inspectionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                .input('xtipoinspeccion', sql.NVarChar, inspectionTypeData.xtipoinspeccion)
                .input('ctipoinspeccion', sql.Int, inspectionTypeData.ctipoinspeccion)
                .query('select * from MATIPOINSPECCION where XTIPOINSPECCION = @xtipoinspeccion and CTIPOINSPECCION != @ctipoinspeccion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateInspectionTypeQuery: async(inspectionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), inspectionTypeData.cpais)
                .input('ccompania', sql.Int, inspectionTypeData.ccompania)
                .input('ctipoinspeccion', sql.Int, inspectionTypeData.ctipoinspeccion)
                .input('xtipoinspeccion', sql.NVarChar, inspectionTypeData.xtipoinspeccion)
                .input('bactivo', sql.Bit, inspectionTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, inspectionTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOINSPECCION set XTIPOINSPECCION = @xtipoinspeccion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOINSPECCION = @ctipoinspeccion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchStateQuery: async(searchData) => {
        try{
            let query = `select * from MAPROVINCIAS where CPAIS = @cpais${ searchData.xestado ? " and XESTADO like '%" + searchData.xestado + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyStateNameToCreateQuery: async(stateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                .input('xestado', sql.NVarChar, stateData.xestado)
                .query('select * from MAESTADO where XESTADO = @xestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createStateQuery: async(stateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xestado', sql.NVarChar, stateData.xestado)
                .input('bactivo', sql.Bit, stateData.bactivo)
                .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                .input('cusuariocreacion', sql.Int, stateData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAESTADO (XESTADO, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xestado, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xestado', sql.NVarChar, stateData.xestado)
                    .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                    .query('select * from MAESTADO where XESTADO = @xestado and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getStateDataQuery: async(stateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                .input('cestado', sql.Int, stateData.cestado)
                .query('select * from MAESTADO where CPAIS = @cpais and CESTADO = @cestado');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyStateNameToUpdateQuery: async(stateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                .input('xestado', sql.NVarChar, stateData.xestado)
                .input('cestado', sql.Int, stateData.cestado)
                .query('select * from MAESTADO where XESTADO = @xestado and CESTADO != @cestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateStateQuery: async(stateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), stateData.cpais)
                .input('cestado', sql.Int, stateData.cestado)
                .input('xestado', sql.NVarChar, stateData.xestado)
                .input('bactivo', sql.Bit, stateData.bactivo)
                .input('cusuariomodificacion', sql.Int, stateData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAESTADO set XESTADO = @xestado, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CESTADO = @cestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPaymentTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOPAGO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtipopago ? " and XTIPOPAGO like '%" + searchData.xtipopago + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPaymentTypeNameToCreateQuery: async(paymentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                .input('ccompania', sql.Int, paymentTypeData.ccompania)
                .input('xtipopago', sql.NVarChar, paymentTypeData.xtipopago)
                .query('select * from MATIPOPAGO where XTIPOPAGO = @xtipopago and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createPaymentTypeQuery: async(paymentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipopago', sql.NVarChar, paymentTypeData.xtipopago)
                .input('bactivo', sql.Bit, paymentTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                .input('ccompania', sql.Int, paymentTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, paymentTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOPAGO (XTIPOPAGO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtipopago, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipopago', sql.NVarChar, paymentTypeData.xtipopago)
                    .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                    .input('ccompania', sql.Int, paymentTypeData.ccompania)
                    .query('select * from MATIPOPAGO where XTIPOPAGO = @xtipopago and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getPaymentTypeDataQuery: async(paymentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                .input('ccompania', sql.Int, paymentTypeData.ccompania)
                .input('ctipopago', sql.Int, paymentTypeData.ctipopago)
                .query('select * from MATIPOPAGO where CPAIS = @cpais and CTIPOPAGO = @ctipopago and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPaymentTypeNameToUpdateQuery: async(paymentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                .input('ccompania', sql.Int, paymentTypeData.ccompania)
                .input('xtipopago', sql.NVarChar, paymentTypeData.xtipopago)
                .input('ctipopago', sql.Int, paymentTypeData.ctipopago)
                .query('select * from MATIPOPAGO where XTIPOPAGO = @xtipopago and CTIPOPAGO != @ctipopago and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updatePaymentTypeQuery: async(paymentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), paymentTypeData.cpais)
                .input('ccompania', sql.Int, paymentTypeData.ccompania)
                .input('ctipopago', sql.Int, paymentTypeData.ctipopago)
                .input('xtipopago', sql.NVarChar, paymentTypeData.xtipopago)
                .input('bactivo', sql.Bit, paymentTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, paymentTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOPAGO set XTIPOPAGO = @xtipopago, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOPAGO = @ctipopago and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchProcessQuery: async(searchData) => {
        try{
            let query = `select * from MAPROCESO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xproceso ? " and XPROCESO like '%" + searchData.xproceso + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProcessNameToCreateQuery: async(processData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), processData.cpais)
                .input('ccompania', sql.Int, processData.ccompania)
                .input('xproceso', sql.NVarChar, processData.xproceso)
                .query('select * from MAPROCESO where XPROCESO = @xproceso and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createProcessQuery: async(processData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xproceso', sql.NVarChar, processData.xproceso)
                .input('bactivo', sql.Bit, processData.bactivo)
                .input('cpais', sql.Numeric(4, 0), processData.cpais)
                .input('ccompania', sql.Int, processData.ccompania)
                .input('cusuariocreacion', sql.Int, processData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAPROCESO (XPROCESO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xproceso, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xproceso', sql.NVarChar, processData.xproceso)
                    .input('cpais', sql.Numeric(4, 0), processData.cpais)
                    .input('ccompania', sql.Int, processData.ccompania)
                    .query('select * from MAPROCESO where XPROCESO = @xproceso and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getProcessDataQuery: async(processData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), processData.cpais)
                .input('ccompania', sql.Int, processData.ccompania)
                .input('cproceso', sql.Int, processData.cproceso)
                .query('select * from MAPROCESO where CPAIS = @cpais and CPROCESO = @cproceso and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProcessNameToUpdateQuery: async(processData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), processData.cpais)
                .input('ccompania', sql.Int, processData.ccompania)
                .input('xproceso', sql.NVarChar, processData.xproceso)
                .input('cproceso', sql.Int, processData.cproceso)
                .query('select * from MAPROCESO where XPROCESO = @xproceso and CPROCESO != @cproceso and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateProcessQuery: async(processData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), processData.cpais)
                .input('ccompania', sql.Int, processData.ccompania)
                .input('cproceso', sql.Int, processData.cproceso)
                .input('xproceso', sql.NVarChar, processData.xproceso)
                .input('bactivo', sql.Bit, processData.bactivo)
                .input('cusuariomodificacion', sql.Int, processData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAPROCESO set XPROCESO = @xproceso, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROCESO = @cproceso and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchTransmissionTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOTRANSMISION where CPAIS = @cpais${ searchData.xtipotransmision ? " and XTIPOTRANSMISION like '%" + searchData.xtipotransmision + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTransmissionTypeNameToCreateQuery: async(transmissionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                .input('xtipotransmision', sql.NVarChar, transmissionTypeData.xtipotransmision)
                .query('select * from MATIPOTRANSMISION where XTIPOTRANSMISION = @xtipotransmision and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createTransmissionTypeQuery: async(transmissionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipotransmision', sql.NVarChar, transmissionTypeData.xtipotransmision)
                .input('bactivo', sql.Bit, transmissionTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                .input('cusuariocreacion', sql.Int, transmissionTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOTRANSMISION (XTIPOTRANSMISION, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xtipotransmision, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipotransmision', sql.NVarChar, transmissionTypeData.xtipotransmision)
                    .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                    .query('select * from MATIPOTRANSMISION where XTIPOTRANSMISION = @xtipotransmision and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getTransmissionTypeDataQuery: async(transmissionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                .input('ctipotransmision', sql.Int, transmissionTypeData.ctipotransmision)
                .query('select * from MATIPOTRANSMISION where CPAIS = @cpais and CTIPOTRANSMISION = @ctipotransmision');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTransmissionTypeNameToUpdateQuery: async(transmissionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                .input('xtipotransmision', sql.NVarChar, transmissionTypeData.xtipotransmision)
                .input('ctipotransmision', sql.Int, transmissionTypeData.ctipotransmision)
                .query('select * from MATIPOTRANSMISION where XTIPOTRANSMISION = @xtipotransmision and CTIPOTRANSMISION != @ctipotransmision and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateTransmissionTypeQuery: async(transmissionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), transmissionTypeData.cpais)
                .input('ctipotransmision', sql.Int, transmissionTypeData.ctipotransmision)
                .input('xtipotransmision', sql.NVarChar, transmissionTypeData.xtipotransmision)
                .input('bactivo', sql.Bit, transmissionTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, transmissionTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOTRANSMISION set XTIPOTRANSMISION = @xtipotransmision, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOTRANSMISION = @ctipotransmision and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchBusinessActivityQuery: async(searchData) => {
        try{
            let query = `select * from MAACTIVIDADEMPRESA where CPAIS = @cpais${ searchData.xactividadempresa ? " and XACTIVIDADEMPRESA like '%" + searchData.xactividadempresa + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBusinessActivityNameToCreateQuery: async(businessActivityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                .input('xactividadempresa', sql.NVarChar, businessActivityData.xactividadempresa)
                .query('select * from MAACTIVIDADEMPRESA where XACTIVIDADEMPRESA = @xactividadempresa and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBusinessActivityQuery: async(businessActivityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xactividadempresa', sql.NVarChar, businessActivityData.xactividadempresa)
                .input('bactivo', sql.Bit, businessActivityData.bactivo)
                .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                .input('cusuariocreacion', sql.Int, businessActivityData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAACTIVIDADEMPRESA (XACTIVIDADEMPRESA, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xactividadempresa, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xactividadempresa', sql.NVarChar, businessActivityData.xactividadempresa)
                    .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                    .query('select * from MAACTIVIDADEMPRESA where XACTIVIDADEMPRESA = @xactividadempresa and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getBusinessActivityDataQuery: async(businessActivityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                .input('cactividadempresa', sql.Int, businessActivityData.cactividadempresa)
                .query('select * from MAACTIVIDADEMPRESA where CPAIS = @cpais and CACTIVIDADEMPRESA = @cactividadempresa');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBusinessActivityNameToUpdateQuery: async(businessActivityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                .input('xactividadempresa', sql.NVarChar, businessActivityData.xactividadempresa)
                .input('cactividadempresa', sql.Int, businessActivityData.cactividadempresa)
                .query('select * from MAACTIVIDADEMPRESA where XACTIVIDADEMPRESA = @xactividadempresa and CACTIVIDADEMPRESA != @cactividadempresa and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateBusinessActivityQuery: async(businessActivityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), businessActivityData.cpais)
                .input('cactividadempresa', sql.Int, businessActivityData.cactividadempresa)
                .input('xactividadempresa', sql.NVarChar, businessActivityData.xactividadempresa)
                .input('bactivo', sql.Bit, businessActivityData.bactivo)
                .input('cusuariomodificacion', sql.Int, businessActivityData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAACTIVIDADEMPRESA set XACTIVIDADEMPRESA = @xactividadempresa, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CACTIVIDADEMPRESA = @cactividadempresa and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCancellationCauseQuery: async(searchData) => {
        try{
            let query = `select * from MACAUSAANULACION where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xcausaanulacion ? " and XCAUSAANULACION like '%" + searchData.xcausaanulacion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCancellationCauseNameToCreateQuery: async(cancellationCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                .input('xcausaanulacion', sql.NVarChar, cancellationCauseData.xcausaanulacion)
                .query('select * from MACAUSAANULACION where XCAUSAANULACION = @xcausaanulacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCancellationCauseQuery: async(cancellationCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcausaanulacion', sql.NVarChar, cancellationCauseData.xcausaanulacion)
                .input('bactivo', sql.Bit, cancellationCauseData.bactivo)
                .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                .input('cusuariocreacion', sql.Int, cancellationCauseData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACAUSAANULACION (XCAUSAANULACION, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xcausaanulacion, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xcausaanulacion', sql.NVarChar, cancellationCauseData.xcausaanulacion)
                    .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                    .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                    .query('select * from MACAUSAANULACION where XCAUSAANULACION = @xcausaanulacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCancellationCauseDataQuery: async(cancellationCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                .input('ccausaanulacion', sql.Int, cancellationCauseData.ccausaanulacion)
                .query('select * from MACAUSAANULACION where CPAIS = @cpais and CCAUSAANULACION = @ccausaanulacion and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCancellationCauseNameToUpdateQuery: async(cancellationCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                .input('xcausaanulacion', sql.NVarChar, cancellationCauseData.xcausaanulacion)
                .input('ccausaanulacion', sql.Int, cancellationCauseData.ccausaanulacion)
                .query('select * from MACAUSAANULACION where XCAUSAANULACION = @xcausaanulacion and CCAUSAANULACION != @ccausaanulacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCancellationCauseQuery: async(cancellationCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cancellationCauseData.cpais)
                .input('ccompania', sql.Int, cancellationCauseData.ccompania)
                .input('ccausaanulacion', sql.Int, cancellationCauseData.ccausaanulacion)
                .input('xcausaanulacion', sql.NVarChar, cancellationCauseData.xcausaanulacion)
                .input('bactivo', sql.Bit, cancellationCauseData.bactivo)
                .input('cusuariomodificacion', sql.Int, cancellationCauseData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACAUSAANULACION set XCAUSAANULACION = @xcausaanulacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCAUSAANULACION = @ccausaanulacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCivilStatusQuery: async(searchData) => {
        try{
            let query = `select * from MAESTADOCIVIL where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xestadocivil ? " and XESTADOCIVIL like '%" + searchData.xestadocivil + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCivilStatusNameToCreateQuery: async(civilStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                .input('ccompania', sql.Int, civilStatusData.ccompania)
                .input('xestadocivil', sql.NVarChar, civilStatusData.xestadocivil)
                .query('select * from MAESTADOCIVIL where XESTADOCIVIL = @xestadocivil and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCivilStatusQuery: async(civilStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xestadocivil', sql.NVarChar, civilStatusData.xestadocivil)
                .input('bactivo', sql.Bit, civilStatusData.bactivo)
                .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                .input('ccompania', sql.Int, civilStatusData.ccompania)
                .input('cusuariocreacion', sql.Int, civilStatusData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAESTADOCIVIL (XESTADOCIVIL, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xestadocivil, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xestadocivil', sql.NVarChar, civilStatusData.xestadocivil)
                    .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                    .input('ccompania', sql.Int, civilStatusData.ccompania)
                    .query('select * from MAESTADOCIVIL where XESTADOCIVIL = @xestadocivil and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCivilStatusDataQuery: async(civilStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                .input('ccompania', sql.Int, civilStatusData.ccompania)
                .input('cestadocivil', sql.Int, civilStatusData.cestadocivil)
                .query('select * from MAESTADOCIVIL where CPAIS = @cpais and CESTADOCIVIL = @cestadocivil and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCivilStatusNameToUpdateQuery: async(civilStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                .input('ccompania', sql.Int, civilStatusData.ccompania)
                .input('xestadocivil', sql.NVarChar, civilStatusData.xestadocivil)
                .input('cestadocivil', sql.Int, civilStatusData.cestadocivil)
                .query('select * from MAESTADOCIVIL where XESTADOCIVIL = @xestadocivil and CESTADOCIVIL != @cestadocivil and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCivilStatusQuery: async(civilStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), civilStatusData.cpais)
                .input('ccompania', sql.Int, civilStatusData.ccompania)
                .input('cestadocivil', sql.Int, civilStatusData.cestadocivil)
                .input('xestadocivil', sql.NVarChar, civilStatusData.xestadocivil)
                .input('bactivo', sql.Bit, civilStatusData.bactivo)
                .input('cusuariomodificacion', sql.Int, civilStatusData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAESTADOCIVIL set XESTADOCIVIL = @xestadocivil, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CESTADOCIVIL = @cestadocivil and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchGeneralStatusQuery: async(searchData) => {
        try{
            let query = `select * from MAESTATUSGENERAL where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xestatusgeneral ? " and XESTATUSGENERAL like '%" + searchData.xestatusgeneral + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyGeneralStatusNameToCreateQuery: async(generalStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                .input('ccompania', sql.Int, generalStatusData.ccompania)
                .input('xestatusgeneral', sql.NVarChar, generalStatusData.xestatusgeneral)
                .query('select * from MAESTATUSGENERAL where XESTATUSGENERAL = @xestatusgeneral and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createGeneralStatusQuery: async(generalStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xestatusgeneral', sql.NVarChar, generalStatusData.xestatusgeneral)
                .input('bactivo', sql.Bit, generalStatusData.bactivo)
                .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                .input('ccompania', sql.Int, generalStatusData.ccompania)
                .input('cusuariocreacion', sql.Int, generalStatusData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAESTATUSGENERAL (XESTATUSGENERAL, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xestatusgeneral, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xestatusgeneral', sql.NVarChar, generalStatusData.xestatusgeneral)
                    .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                    .input('ccompania', sql.Int, generalStatusData.ccompania)
                    .query('select * from MAESTATUSGENERAL where XESTATUSGENERAL = @xestatusgeneral and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getGeneralStatusDataQuery: async(generalStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                .input('ccompania', sql.Int, generalStatusData.ccompania)
                .input('cestatusgeneral', sql.Int, generalStatusData.cestatusgeneral)
                .query('select * from MAESTATUSGENERAL where CPAIS = @cpais and CESTATUSGENERAL = @cestatusgeneral and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyGeneralStatusNameToUpdateQuery: async(generalStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                .input('ccompania', sql.Int, generalStatusData.ccompania)
                .input('xestatusgeneral', sql.NVarChar, generalStatusData.xestatusgeneral)
                .input('cestatusgeneral', sql.Int, generalStatusData.cestatusgeneral)
                .query('select * from MAESTATUSGENERAL where XESTATUSGENERAL = @xestatusgeneral and CESTATUSGENERAL != @cestatusgeneral and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateGeneralStatusQuery: async(generalStatusData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), generalStatusData.cpais)
                .input('ccompania', sql.Int, generalStatusData.ccompania)
                .input('cestatusgeneral', sql.Int, generalStatusData.cestatusgeneral)
                .input('xestatusgeneral', sql.NVarChar, generalStatusData.xestatusgeneral)
                .input('bactivo', sql.Bit, generalStatusData.bactivo)
                .input('cusuariomodificacion', sql.Int, generalStatusData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAESTATUSGENERAL set XESTATUSGENERAL = @xestatusgeneral, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CESTATUSGENERAL = @cestatusgeneral and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchReplacementTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOREPUESTO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtiporepuesto ? " and XTIPOREPUESTO like '%" + searchData.xtiporepuesto + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyReplacementTypeNameToCreateQuery: async(replacementTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                .input('ccompania', sql.Int, replacementTypeData.ccompania)
                .input('xtiporepuesto', sql.NVarChar, replacementTypeData.xtiporepuesto)
                .query('select * from MATIPOREPUESTO where XTIPOREPUESTO = @xtiporepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createReplacementTypeQuery: async(replacementTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtiporepuesto', sql.NVarChar, replacementTypeData.xtiporepuesto)
                .input('bactivo', sql.Bit, replacementTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                .input('ccompania', sql.Int, replacementTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, replacementTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOREPUESTO (XTIPOREPUESTO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtiporepuesto, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtiporepuesto', sql.NVarChar, replacementTypeData.xtiporepuesto)
                    .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                    .input('ccompania', sql.Int, replacementTypeData.ccompania)
                    .query('select * from MATIPOREPUESTO where XTIPOREPUESTO = @xtiporepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getReplacementTypeDataQuery: async(replacementTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                .input('ccompania', sql.Int, replacementTypeData.ccompania)
                .input('ctiporepuesto', sql.Int, replacementTypeData.ctiporepuesto)
                .query('select * from MATIPOREPUESTO where CPAIS = @cpais and CTIPOREPUESTO = @ctiporepuesto and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyReplacementTypeNameToUpdateQuery: async(replacementTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                .input('ccompania', sql.Int, replacementTypeData.ccompania)
                .input('xtiporepuesto', sql.NVarChar, replacementTypeData.xtiporepuesto)
                .input('ctiporepuesto', sql.Int, replacementTypeData.ctiporepuesto)
                .query('select * from MATIPOREPUESTO where XTIPOREPUESTO = @xtiporepuesto and CTIPOREPUESTO != @ctiporepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateReplacementTypeQuery: async(replacementTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementTypeData.cpais)
                .input('ccompania', sql.Int, replacementTypeData.ccompania)
                .input('ctiporepuesto', sql.Int, replacementTypeData.ctiporepuesto)
                .input('xtiporepuesto', sql.NVarChar, replacementTypeData.xtiporepuesto)
                .input('bactivo', sql.Bit, replacementTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, replacementTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOREPUESTO set XTIPOREPUESTO = @xtiporepuesto, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOREPUESTO = @ctiporepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDepreciationQuery: async(searchData) => {
        try{
            let query = `select * from MADEPRECIACION where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xdepreciacion ? " and XDEPRECIACION like '%" + searchData.xdepreciacion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDepreciationNameToCreateQuery: async(depreciationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                .input('ccompania', sql.Int, depreciationData.ccompania)
                .input('xdepreciacion', sql.NVarChar, depreciationData.xdepreciacion)
                .query('select * from MADEPRECIACION where XDEPRECIACION = @xdepreciacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDepreciationQuery: async(depreciationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdepreciacion', sql.NVarChar, depreciationData.xdepreciacion)
                .input('bactivo', sql.Bit, depreciationData.bactivo)
                .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                .input('ccompania', sql.Int, depreciationData.ccompania)
                .input('cusuariocreacion', sql.Int, depreciationData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MADEPRECIACION (XDEPRECIACION, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xdepreciacion, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xdepreciacion', sql.NVarChar, depreciationData.xdepreciacion)
                    .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                    .input('ccompania', sql.Int, depreciationData.ccompania)
                    .query('select * from MADEPRECIACION where XDEPRECIACION = @xdepreciacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getDepreciationDataQuery: async(depreciationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                .input('ccompania', sql.Int, depreciationData.ccompania)
                .input('cdepreciacion', sql.Int, depreciationData.cdepreciacion)
                .query('select * from MADEPRECIACION where CPAIS = @cpais and CDEPRECIACION = @cdepreciacion and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDepreciationNameToUpdateQuery: async(depreciationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                .input('ccompania', sql.Int, depreciationData.ccompania)
                .input('xdepreciacion', sql.NVarChar, depreciationData.xdepreciacion)
                .input('cdepreciacion', sql.Int, depreciationData.cdepreciacion)
                .query('select * from MADEPRECIACION where XDEPRECIACION = @xdepreciacion and CDEPRECIACION != @cdepreciacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateDepreciationQuery: async(depreciationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), depreciationData.cpais)
                .input('ccompania', sql.Int, depreciationData.ccompania)
                .input('cdepreciacion', sql.Int, depreciationData.cdepreciacion)
                .input('xdepreciacion', sql.NVarChar, depreciationData.xdepreciacion)
                .input('bactivo', sql.Bit, depreciationData.bactivo)
                .input('cusuariomodificacion', sql.Int, depreciationData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MADEPRECIACION set XDEPRECIACION = @xdepreciacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDEPRECIACION = @cdepreciacion and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchServiceDepletionTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOAGOTAMIENTOSERVICIO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtipoagotamientoservicio ? " and XTIPOAGOTAMIENTOSERVICIO like '%" + searchData.xtipoagotamientoservicio + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceDepletionTypeNameToCreateQuery: async(serviceDepletionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                .input('xtipoagotamientoservicio', sql.NVarChar, serviceDepletionTypeData.xtipoagotamientoservicio)
                .query('select * from MATIPOAGOTAMIENTOSERVICIO where XTIPOAGOTAMIENTOSERVICIO = @xtipoagotamientoservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createServiceDepletionTypeQuery: async(serviceDepletionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipoagotamientoservicio', sql.NVarChar, serviceDepletionTypeData.xtipoagotamientoservicio)
                .input('bactivo', sql.Bit, serviceDepletionTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, serviceDepletionTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOAGOTAMIENTOSERVICIO (XTIPOAGOTAMIENTOSERVICIO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtipoagotamientoservicio, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipoagotamientoservicio', sql.NVarChar, serviceDepletionTypeData.xtipoagotamientoservicio)
                    .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                    .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                    .query('select * from MATIPOAGOTAMIENTOSERVICIO where XTIPOAGOTAMIENTOSERVICIO = @xtipoagotamientoservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceDepletionTypeDataQuery: async(serviceDepletionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                .input('ctipoagotamientoservicio', sql.Int, serviceDepletionTypeData.ctipoagotamientoservicio)
                .query('select * from MATIPOAGOTAMIENTOSERVICIO where CPAIS = @cpais and CTIPOAGOTAMIENTOSERVICIO = @ctipoagotamientoservicio and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceDepletionTypeNameToUpdateQuery: async(serviceDepletionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                .input('xtipoagotamientoservicio', sql.NVarChar, serviceDepletionTypeData.xtipoagotamientoservicio)
                .input('ctipoagotamientoservicio', sql.Int, serviceDepletionTypeData.ctipoagotamientoservicio)
                .query('select * from MATIPOAGOTAMIENTOSERVICIO where XTIPOAGOTAMIENTOSERVICIO = @xtipoagotamientoservicio and CTIPOAGOTAMIENTOSERVICIO != @ctipoagotamientoservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateServiceDepletionTypeQuery: async(serviceDepletionTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceDepletionTypeData.cpais)
                .input('ccompania', sql.Int, serviceDepletionTypeData.ccompania)
                .input('ctipoagotamientoservicio', sql.Int, serviceDepletionTypeData.ctipoagotamientoservicio)
                .input('xtipoagotamientoservicio', sql.NVarChar, serviceDepletionTypeData.xtipoagotamientoservicio)
                .input('bactivo', sql.Bit, serviceDepletionTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, serviceDepletionTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOAGOTAMIENTOSERVICIO set XTIPOAGOTAMIENTOSERVICIO = @xtipoagotamientoservicio, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOAGOTAMIENTOSERVICIO = @ctipoagotamientoservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDocumentTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPODOCIDENTIDAD where CPAIS = @cpais${ searchData.xtipodocidentidad ? " and XTIPODOCIDENTIDAD like '%" + searchData.xtipodocidentidad + "%'" : '' }${ searchData.xdescripcion ? " and XDESCRIPCION like '%" + searchData.xdescripcion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDocumentTypeNameToCreateQuery: async(documentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                .input('xtipodocidentidad', sql.NVarChar, documentTypeData.xtipodocidentidad)
                .query('select * from MATIPODOCIDENTIDAD where XTIPODOCIDENTIDAD = @xtipodocidentidad and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDocumentTypeQuery: async(documentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtipodocidentidad', sql.NVarChar, documentTypeData.xtipodocidentidad)
                .input('xdescripcion', sql.NVarChar, documentTypeData.xdescripcion)
                .input('bactivo', sql.Bit, documentTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                .input('cusuariocreacion', sql.Int, documentTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPODOCIDENTIDAD (XTIPODOCIDENTIDAD, XDESCRIPCION, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xtipodocidentidad, @xdescripcion, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtipodocidentidad', sql.NVarChar, documentTypeData.xtipodocidentidad)
                    .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                    .query('select * from MATIPODOCIDENTIDAD where XTIPODOCIDENTIDAD = @xtipodocidentidad and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getDocumentTypeDataQuery: async(documentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                .input('ctipodocidentidad', sql.Int, documentTypeData.ctipodocidentidad)
                .query('select * from MATIPODOCIDENTIDAD where CPAIS = @cpais and CTIPODOCIDENTIDAD = @ctipodocidentidad');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDocumentTypeNameToUpdateQuery: async(documentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                .input('xtipodocidentidad', sql.NVarChar, documentTypeData.xtipodocidentidad)
                .input('ctipodocidentidad', sql.Int, documentTypeData.ctipodocidentidad)
                .query('select * from MATIPODOCIDENTIDAD where XTIPODOCIDENTIDAD = @xtipodocidentidad and CTIPODOCIDENTIDAD != @ctipodocidentidad and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateDocumentTypeQuery: async(documentTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentTypeData.cpais)
                .input('ctipodocidentidad', sql.Int, documentTypeData.ctipodocidentidad)
                .input('xtipodocidentidad', sql.NVarChar, documentTypeData.xtipodocidentidad)
                .input('xdescripcion', sql.NVarChar, documentTypeData.xdescripcion)
                .input('bactivo', sql.Bit, documentTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, documentTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPODOCIDENTIDAD set XTIPODOCIDENTIDAD = @xtipodocidentidad, XDESCRIPCION = @xdescripcion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPenaltyQuery: async(searchData) => {
        try{
            let query = `select * from MAPENALIZACION where CPAIS = @cpais${ searchData.xpenalizacion ? " and XPENALIZACION like '%" + searchData.xpenalizacion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPenaltyNameToCreateQuery: async(penaltyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                .input('xpenalizacion', sql.NVarChar, penaltyData.xpenalizacion)
                .query('select * from MAPENALIZACION where XPENALIZACION = @xpenalizacion and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createPenaltyQuery: async(penaltyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xpenalizacion', sql.NVarChar, penaltyData.xpenalizacion)
                .input('bactivo', sql.Bit, penaltyData.bactivo)
                .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                .input('cusuariocreacion', sql.Int, penaltyData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAPENALIZACION (XPENALIZACION, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xpenalizacion, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xpenalizacion', sql.NVarChar, penaltyData.xpenalizacion)
                    .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                    .query('select * from MAPENALIZACION where XPENALIZACION = @xpenalizacion and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getPenaltyDataQuery: async(penaltyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                .input('cpenalizacion', sql.Int, penaltyData.cpenalizacion)
                .query('select * from MAPENALIZACION where CPAIS = @cpais and CPENALIZACION = @cpenalizacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPenaltyNameToUpdateQuery: async(penaltyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                .input('xpenalizacion', sql.NVarChar, penaltyData.xpenalizacion)
                .input('cpenalizacion', sql.Int, penaltyData.cpenalizacion)
                .query('select * from MAPENALIZACION where XPENALIZACION = @xpenalizacion and CPENALIZACION != @cpenalizacion and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updatePenaltyQuery: async(penaltyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), penaltyData.cpais)
                .input('cpenalizacion', sql.Int, penaltyData.cpenalizacion)
                .input('xpenalizacion', sql.NVarChar, penaltyData.xpenalizacion)
                .input('bactivo', sql.Bit, penaltyData.bactivo)
                .input('cusuariomodificacion', sql.Int, penaltyData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAPENALIZACION set XPENALIZACION = @xpenalizacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPENALIZACION = @cpenalizacion and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCityQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCIUDADDATA where CPAIS = @cpais${ searchData.cestado ? " and CESTADO = @cestado" : '' }${ searchData.xciudad ? " and XPENALIZACION like '%" + searchData.xciudad + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('cestado', sql.Int, searchData.cestado ? searchData.cestado : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCityNameToCreateQuery: async(cityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                .input('cestado', sql.Int, cityData.cestado)
                .input('xciudad', sql.NVarChar, cityData.xciudad)
                .query('select * from MACIUDAD where XCIUDAD = @xciudad and CESTADO = @cestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCityQuery: async(cityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xciudad', sql.NVarChar, cityData.xciudad)
                .input('cestado', sql.Int, cityData.cestado)
                .input('bactivo', sql.Bit, cityData.bactivo)
                .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                .input('cusuariocreacion', sql.Int, cityData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACIUDAD (XCIUDAD, CESTADO, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xciudad, @cestado, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xciudad', sql.NVarChar, cityData.xciudad)
                    .input('cestado', sql.Int, cityData.cestado)
                    .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                    .query('select * from MACIUDAD where XCIUDAD = @xciudad and CESTADO = @cestado and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCityDataQuery: async(cityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                .input('cprovincia', sql.Int, cityData.cciudad)
                .query('select * from MADISTRITOS where CPAIS = @cpais and CPROVINCIA = @cprovincia');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCityNameToUpdateQuery: async(cityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                .input('xciudad', sql.NVarChar, cityData.xciudad)
                .input('cciudad', sql.Int, cityData.cciudad)
                .input('cestado', sql.Int, cityData.cestado)
                .query('select * from MACIUDAD where XCIUDAD = @xciudad and CCIUDAD != @cciudad and CPAIS = @cpais and CESTADO = @cestado');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCityQuery: async(cityData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cityData.cpais)
                .input('cciudad', sql.Int, cityData.cciudad)
                .input('cestado', sql.Int, cityData.cestado)
                .input('xciudad', sql.NVarChar, cityData.xciudad)
                .input('bactivo', sql.Bit, cityData.bactivo)
                .input('cusuariomodificacion', sql.Int, cityData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACIUDAD set XCIUDAD = @xciudad, CESTADO = @cestado, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCIUDAD = @cciudad and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    stateValrepQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select CESTADO, XESTADO, BACTIVO from MAESTADO where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchRelationshipQuery: async(searchData) => {
        try{
            let query = `select * from MAPARENTESCO where CPAIS = @cpais${ searchData.xparentesco ? " and XPARENTESCO like '%" + searchData.xparentesco + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRelationshipNameToCreateQuery: async(relationshipData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                .input('xparentesco', sql.NVarChar, relationshipData.xparentesco)
                .query('select * from MAPARENTESCO where XPARENTESCO = @xparentesco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createRelationshipQuery: async(relationshipData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xparentesco', sql.NVarChar, relationshipData.xparentesco)
                .input('bactivo', sql.Bit, relationshipData.bactivo)
                .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                .input('cusuariocreacion', sql.Int, relationshipData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAPARENTESCO (XPARENTESCO, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xparentesco, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xparentesco', sql.NVarChar, relationshipData.xparentesco)
                    .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                    .query('select * from MAPARENTESCO where XPARENTESCO = @xparentesco and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getRelationshipDataQuery: async(relationshipData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                .input('cparentesco', sql.Int, relationshipData.cparentesco)
                .query('select * from MAPARENTESCO where CPAIS = @cpais and CPARENTESCO = @cparentesco');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRelationshipNameToUpdateQuery: async(relationshipData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                .input('xparentesco', sql.NVarChar, relationshipData.xparentesco)
                .input('cparentesco', sql.Int, relationshipData.cparentesco)
                .query('select * from MAPARENTESCO where XPARENTESCO = @xparentesco and CPARENTESCO != @cparentesco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateRelationshipQuery: async(relationshipData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), relationshipData.cpais)
                .input('cparentesco', sql.Int, relationshipData.cparentesco)
                .input('xparentesco', sql.NVarChar, relationshipData.xparentesco)
                .input('bactivo', sql.Bit, relationshipData.bactivo)
                .input('cusuariomodificacion', sql.Int, relationshipData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAPARENTESCO set XPARENTESCO = @xparentesco, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPARENTESCO = @cparentesco and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDocumentQuery: async(searchData) => {
        try{
            let query = `select * from MADOCUMENTO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xdocumento ? " and XDOCUMENTO like '%" + searchData.xdocumento + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDocumentNameToCreateQuery: async(documentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                .input('ccompania', sql.Int, documentData.ccompania)
                .input('xdocumento', sql.NVarChar, documentData.xdocumento)
                .query('select * from MADOCUMENTO where XDOCUMENTO = @xdocumento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDocumentQuery: async(documentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdocumento', sql.NVarChar, documentData.xdocumento)
                .input('bactivo', sql.Bit, documentData.bactivo)
                .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                .input('ccompania', sql.Int, documentData.ccompania)
                .input('cusuariocreacion', sql.Int, documentData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MADOCUMENTO (XDOCUMENTO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xdocumento, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xdocumento', sql.NVarChar, documentData.xdocumento)
                    .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                    .input('ccompania', sql.Int, documentData.ccompania)
                    .query('select * from MADOCUMENTO where XDOCUMENTO = @xdocumento and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getDocumentDataQuery: async(documentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                .input('ccompania', sql.Int, documentData.ccompania)
                .input('cdocumento', sql.Int, documentData.cdocumento)
                .query('select * from MADOCUMENTO where CPAIS = @cpais and CDOCUMENTO = @cdocumento and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDocumentNameToUpdateQuery: async(documentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                .input('ccompania', sql.Int, documentData.ccompania)
                .input('xdocumento', sql.NVarChar, documentData.xdocumento)
                .input('cdocumento', sql.Int, documentData.cdocumento)
                .query('select * from MADOCUMENTO where XDOCUMENTO = @xdocumento and CDOCUMENTO != @cdocumento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateDocumentQuery: async(documentData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), documentData.cpais)
                .input('ccompania', sql.Int, documentData.ccompania)
                .input('cdocumento', sql.Int, documentData.cdocumento)
                .input('xdocumento', sql.NVarChar, documentData.xdocumento)
                .input('bactivo', sql.Bit, documentData.bactivo)
                .input('cusuariomodificacion', sql.Int, documentData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MADOCUMENTO set XDOCUMENTO = @xdocumento, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDOCUMENTO = @cdocumento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchTaxQuery: async(searchData) => {
        try{
            let query = `select * from MAIMPUESTO where CPAIS = @cpais${ searchData.ximpuesto ? " and XIMPUESTO like '%" + searchData.ximpuesto + "%'" : '' }${ searchData.xobservacion ? " and XOBSERVACION like '%" + searchData.xobservacion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTaxNameToCreateQuery: async(taxData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), taxData.cpais)
                .input('ximpuesto', sql.NVarChar, taxData.ximpuesto)
                .query('select * from MAIMPUESTO where XIMPUESTO = @ximpuesto and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createTaxQuery: async(taxData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ximpuesto', sql.NVarChar, taxData.ximpuesto)
                .input('xobservacion', sql.NVarChar, taxData.xobservacion)
                .input('bactivo', sql.Bit, taxData.bactivo)
                .input('cpais', sql.Numeric(4, 0), taxData.cpais)
                .input('cusuariocreacion', sql.Int, taxData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAIMPUESTO (XIMPUESTO, XOBSERVACION, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@ximpuesto, @xobservacion, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('ximpuesto', sql.NVarChar, taxData.ximpuesto)
                    .input('cpais', sql.Numeric(4, 0), taxData.cpais)
                    .query('select * from MAIMPUESTO where XIMPUESTO = @ximpuesto and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getTaxDataQuery: async(cimpuesto) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cimpuesto', sql.Int, cimpuesto)
                .query('select * from MAIMPUESTO WHERE CIMPUESTO = @cimpuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTaxNameToUpdateQuery: async(taxData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), taxData.cpais)
                .input('ximpuesto', sql.NVarChar, taxData.ximpuesto)
                .input('cimpuesto', sql.Int, taxData.cimpuesto)
                .query('select * from MAIMPUESTO where XIMPUESTO = @ximpuesto and CIMPUESTO != @cimpuesto and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateTaxQuery: async(taxData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), taxData.cpais)
                .input('cimpuesto', sql.Int, taxData.cimpuesto)
                .input('ximpuesto', sql.NVarChar, taxData.ximpuesto)
                .input('xobservacion', sql.NVarChar, taxData.xobservacion)
                .input('bactivo', sql.Bit, taxData.bactivo)
                .input('cusuariomodificacion', sql.Int, taxData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAIMPUESTO set XIMPUESTO = @ximpuesto, XOBSERVACION = @xobservacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CIMPUESTO = @cimpuesto and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchBrandQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARMARCAMODELOVERSION where CPAIS = @cpais${ searchData.cmarca ? " and CMARCA = @cmarca" : '' }${ searchData.cmodelo ? " and CMODELO = @cmodelo" : '' }${ searchData.cversion ? " and CVERSION = @cversion" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                .input('cmodelo', sql.Int, searchData.cmodelo ? searchData.cmodelo : 1)
                .input('cversion', sql.Int, searchData.cversion ? searchData.cversion : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrandNameToCreateQuery: async(brandData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                .input('xmarca', sql.NVarChar, brandData.xmarca)
                .query('select * from MAMARCA where XMARCA = @xmarca and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBrandQuery: async(brandData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xmarca', sql.NVarChar, brandData.xmarca)
                .input('bactivo', sql.Bit, brandData.bactivo)
                .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                .input('cusuariocreacion', sql.Int, brandData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAMARCA (XMARCA, BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xmarca, @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xmarca', sql.NVarChar, brandData.xmarca)
                    .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                    .query('select * from MAMARCA where XMARCA = @xmarca and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getBrandDataQuery: async(brandData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                .input('cmarca', sql.Int, brandData.cmarca)
                .query('select * from MAMARCA where CPAIS = @cpais and CMARCA = @cmarca');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrandNameToUpdateQuery: async(brandData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                .input('xmarca', sql.NVarChar, brandData.xmarca)
                .input('cmarca', sql.Int, brandData.cmarca)
                .query('select * from MAMARCA where XMARCA = @xmarca and CMARCA != @cmarca and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateBrandQuery: async(brandData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brandData.cpais)
                .input('cmarca', sql.Int, brandData.cmarca)
                .input('xmarca', sql.NVarChar, brandData.xmarca)
                .input('bactivo', sql.Bit, brandData.bactivo)
                .input('cusuariomodificacion', sql.Int, brandData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAMARCA set XMARCA = @xmarca, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CMARCA = @cmarca and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    searchServiceQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARSERVICIODATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ctiposervicio ? " and CTIPOSERVICIO = @ctiposervicio" : '' }${ searchData.xservicio ? " and XSERVICIO like '%" + searchData.xservicio + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctiposervicio', sql.Int, searchData.ctiposervicio ? searchData.ctiposervicio : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchInsurerServiceQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARSERVICIOASEGURADORA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ctiposervicio ? " and CTIPOSERVICIO = @CTIPOSERVICIO" : '' }${ searchData.xservicio ? " and XSERVICIO_ASEG like '%" + searchData.xservicio + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctiposervicio', sql.Int, searchData.ctiposervicio ? searchData.ctiposervicio : 1)
                .input('xservicio', sql.NVarChar, searchData.xservicio ? searchData.xservicio : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceNameToCreateQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('ctiposervicio', sql.Int, serviceData.ctiposervicio)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .query('select * from MASERVICIO where XSERVICIO = @xservicio and CTIPOSERVICIO = @ctiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceInsurerNameToCreateQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .query('select * from MASERVICIO_ASEG where XSERVICIO = @xservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createServiceQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('ctiposervicio', sql.Int, serviceData.ctiposervicio)
                .input('bactivo', sql.Bit, serviceData.bactivo)
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cusuariocreacion', sql.Int, serviceData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MASERVICIO (XSERVICIO, CTIPOSERVICIO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xservicio, @ctiposervicio, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xservicio', sql.NVarChar, serviceData.xservicio)
                    .input('ctiposervicio', sql.Int, serviceData.ctiposervicio)
                    .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                    .input('ccompania', sql.Int, serviceData.ccompania)
                    .query('select * from MASERVICIO where XSERVICIO = @xservicio and CTIPOSERVICIO = @ctiposervicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){

            return { error: err.message };
        }
    },
    createServiceInsurerQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('bactivo', sql.Bit, serviceData.bactivo)
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cusuariocreacion', sql.Int, serviceData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MASERVICIO_ASEG (XSERVICIO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xservicio, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xservicio', sql.NVarChar, serviceData.xservicio)
                    .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                    .input('ccompania', sql.Int, serviceData.ccompania)
                    .query('select * from MASERVICIO_ASEG where XSERVICIO = @xservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceDataQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .query('select * from MASERVICIO where CPAIS = @cpais and CCOMPANIA = @ccompania and CSERVICIO = @cservicio');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceInsurerDataQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .query('select * from VWBUSCARSERVICIOASEGURADORA where CPAIS = @cpais and CCOMPANIA = @ccompania and CSERVICIO_ASEG = @cservicio');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getAditionalServices: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cpais', sql.Int, searchData.cpais)
                .query('select * from MASERVICIO where CCOMPANIA = @ccompania and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getAditionalServicesQuotes: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cpais', sql.Int, searchData.cpais)
                .query('select * from MASERVICIO where CCOMPANIA = @ccompania AND CPAIS = @cpais AND CSERVICIO in (282,283)');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceNameToUpdateQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .input('ctiposervicio', sql.Int, serviceData.ctiposervicio)
                .query('select * from MASERVICIO where XSERVICIO = @xservicio and CSERVICIO != @cservicio and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOSERVICIO = @ctiposervicio');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceInsurerNameToUpdateQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .query('select * from MASERVICIO_ASEG where XSERVICIO = @xservicio and CSERVICIO != @cservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateServiceQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .input('ctiposervicio', sql.Int, serviceData.ctiposervicio)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('bactivo', sql.Bit, serviceData.bactivo)
                .input('cusuariomodificacion', sql.Int, serviceData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MASERVICIO set XSERVICIO = @xservicio, CTIPOSERVICIO = @ctiposervicio, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSERVICIO = @cservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateServiceInsurerQuery: async(serviceData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), serviceData.cpais)
                .input('ccompania', sql.Int, serviceData.ccompania)
                .input('cservicio', sql.Int, serviceData.cservicio)
                .input('xservicio', sql.NVarChar, serviceData.xservicio)
                .input('bactivo', sql.Bit, serviceData.bactivo)
                .input('cusuariomodificacion', sql.Int, serviceData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MASERVICIO_ASEG set XSERVICIO = @xservicio, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSERVICIO = @cservicio and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchServiceOrderQuery: async(searchData) => {
        try{
            let query = `select CORDEN, XNOMBRE, XAPELLIDO, XCLIENTE, FCREACION from VWBUSCARORDENSERVICIOXFLOTA where BACTIVO = 1${ searchData.corden ? " and CORDEN = @corden" : '' }`;/*where CORDEN = @corden${ searchData.ctiposervicio ? " and CTIPOSERVICIO = @ctiposervicio" : '' }${ searchData.xservicio ? " and XSERVICIO like '%" + searchData.xservicio + "%'" : '' }`;*/
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('corden', sql.Int, searchData.corden)
                .input('cservicio', sql.Int, searchData.cservicio)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyServiceOrderNameToCreateQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('corden', sql.Int, serviceOrderData.corden)
                .query('select * from EVORDENSERVICIO where CORDEN = @corden');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createServiceOrderQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cservicio', sql.Int, serviceOrderData.cservicio ? serviceOrderData.cservicio : null)
                .input('cservicioadicional', sql.Int, serviceOrderData.cservicioadicional ? serviceOrderData.cservicioadicional : null)
                .input('cnotificacion', sql.Int, serviceOrderData.cnotificacion)
                //.input('cproveedor', sql.Int, serviceOrderData.cproveedor)
                .input('xobservacion', sql.NVarChar, serviceOrderData.xobservacion)
                .input('xfecha', sql.NVarChar, serviceOrderData.xfecha)
                .input('xdanos', sql.NVarChar, serviceOrderData.xdanos)
                .input('fajuste', sql.DateTime, serviceOrderData.fajuste)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into EVORDENSERVICIO (CSERVICIO, CSERVICIOADICIONAL, FCREACION, CNOTIFICACION, XOBSERVACION, XFECHA, XDANOS, FAJUSTE, BACTIVO) output inserted.CORDEN values (@cservicio, @cservicioadicional, @fcreacion, @cnotificacion, @xobservacion, @xfecha, @xdanos, @fajuste, 1)');
                return { result: result };
            }catch(err){
            return { error: err.message };
        }
    },

    createExhibitQuery: async(exhibitData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xanexo', sql.NVarChar, exhibitData.xanexo)
                .input('xobservacion', sql.NVarChar, exhibitData.xobservacion ? exhibitData.xobservacion : undefined)
                .input('bactivo', sql.Bit, exhibitData.bactivo)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAANEXO (XANEXO, XOBSERVACION, FCREACION, BACTIVO) output inserted.CANEXO values (@xanexo, @xobservacion, @fcreacion, @bactivo)');
                return { result: result };
            }catch(err){
            return { error: err.message };
        }
    },

    verifyServiceOrderNameToUpdateQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('corden', sql.Numeric(4, 0), serviceOrderData.corden)
                .input('cservicio', sql.NVarChar, serviceOrderData.cservicio)
                .input('cnotificacion', sql.Int, serviceOrderData.cnotificacion)
                .query('select * from EVORDENSERVICIO where CORDEN != @corden and CSERVICIO = @cservicio and CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    updateServiceOrderQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('corden', sql.Int, serviceOrderData.corden)
                .input('cservicio', sql.Int, serviceOrderData.cservicio)
                .input('cnotificacion', sql.Int, serviceOrderData.cnotificacion)
                .input('xobservacion', sql.NVarChar, serviceOrderData.xobservacion)
                .query('update EVORDENSERVICIO set CSERVICIO = @cservicio, CNOTIFICACION = @cnotificacion, XOBSERVACION = @xobservacion where CORDEN = @corden');
            //sql.close();
            
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceOrderDataQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('corden', sql.Int, serviceOrderData.corden)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA where CORDEN = @corden');
            //sql.close();
            return { result: result};
        }catch(err){
            return { error: err.message };
        }
    },

    getServiceOrderPopUpDataQuery: async(serviceOrderData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, serviceOrderData.cnotificacion)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result};
        }catch(err){
            return { error: err.message };
        }
    },

    notificationValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from VWBUSCARNOTIFICACIONXCONTRATOENOS where BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationDetailQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select CNOTIFICACION, CCONTRATOFLOTA, XNOMBRE, XAPELLIDO, XNOMBREALTERNATIVO, XAPELLIDOALTERNATIVO, FCREACION, XMARCA from VWBUSCARORDENSERVICIOXFLOTA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationServiceOrderDetailQuery: async(cnotificacion, corden) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .input('corden', sql.Int, corden)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA where CNOTIFICACION = @cnotificacion and CORDEN = @corden');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationOwnerDetailQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARNOTIFICACIONXPROPIETARIO where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationCollectionsDetailQuery: async(ctiponotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ctiponotificacion', sql.Int, ctiponotificacion)
                .query('select * from MARECAUDOS where CTIPONOTIFICACION = @ctiponotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationDocumentationDetailQuery: async(crecaudo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecaudo', sql.Int, crecaudo)
                .query('select * from MADOCUMENTOS where CRECAUDO = @crecaudo and BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    notificationOrderDetailQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion ? cnotificacion: undefined)
                .query('select * from VWBUSCARDATAORDENSERVICIO where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    serviceTypeValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select CTIPOSERVICIO, XTIPOSERVICIO, BACTIVO from MATIPOSERVICIO where BACTIVO = 1 and CCOMPANIA = 5');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    serviceTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOSERVICIO, XTIPOSERVICIO, BACTIVO from MATIPOSERVICIO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    brandValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CMARCA, XMARCA, BACTIVO from MAMARCA where CPAIS = @cpais ORDER BY XMARCA');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchModelQuery: async(searchData) => {
        try{
            let query = `select DISTINCT XMODELO from VWBUSCARMARCAMODELOVERSION where CPAIS = @cpais${ searchData.cmarca ? " and CMARCA = @cmarca" : '' } AND BACTIVO = 1`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyModelNameToCreateQuery: async(modelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                .input('cmarca', sql.Int, modelData.cmarca)
                .input('xmodelo', sql.NVarChar, modelData.xmodelo)
                .query('select * from MAMODELO where XMODELO = @xmodelo and CMARCA = @cmarca and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createModelQuery: async(modelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xmodelo', sql.NVarChar, modelData.xmodelo)
                .input('cmarca', sql.Int, modelData.cmarca)
                //.input('casociado', sql.Int, modelData.casociado)
                .input('bactivo', sql.Bit, modelData.bactivo)
                .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                .input('cusuariocreacion', sql.Int, modelData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAMODELO (XMODELO, CMARCA,  BACTIVO, CPAIS, CUSUARIOCREACION, FCREACION) values (@xmodelo, @cmarca,  @bactivo, @cpais, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xmodelo', sql.NVarChar, modelData.xmodelo)
                    .input('cmarca', sql.Int, modelData.cmarca)
                    .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                    .query('select * from MAMODELO where XMODELO = @xmodelo and CMARCA = @cmarca and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getModelDataQuery: async(modelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                .input('cmodelo', sql.Int, modelData.cmodelo)
                .query('select * from MAMODELO where CPAIS = @cpais and CMODELO = @cmodelo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyModelNameToUpdateQuery: async(modelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                .input('xmodelo', sql.NVarChar, modelData.xmodelo)
                .input('cmodelo', sql.Int, modelData.cmodelo)
                .input('cmarca', sql.Int, modelData.cmarca)
                .query('select * from MAMODELO where XMODELO = @xmodelo and CMODELO != @cmodelo and CPAIS = @cpais and CMARCA = @cmarca');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateModelQuery: async(modelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), modelData.cpais)
                .input('cmodelo', sql.Int, modelData.cmodelo)
                .input('cmarca', sql.Int, modelData.cmarca)
                // .input('casociado', sql.Int, modelData.casociado)
                .input('xmodelo', sql.NVarChar, modelData.xmodelo)
                .input('bactivo', sql.Bit, modelData.bactivo)
                .input('cusuariomodificacion', sql.Int, modelData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAMODELO set XMODELO = @xmodelo,  BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CMODELO = @cmodelo and CPAIS = @cpais AND CMARCA = @cmarca');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    modelValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('cmarca', sql.Int, searchData.cmarca)
                .query('select CMARCA, CMODELO, XMODELO, BACTIVO from MAMODELO where CPAIS = @cpais AND CMARCA = @cmarca');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchVersionQuery: async(searchData) => {
        try{
            let query = `select * from MAVERSION where CPAIS = @cpais${ searchData.cmarca ? " and CMARCA = @cmarca" : '' }${ searchData.cmodelo ? " and CMODELO = @cmodelo" : '' }${ searchData.xversion ? " and XVERSION like '%" + searchData.xversion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                .input('cmodelo', sql.Int, searchData.cmodelo ? searchData.cmodelo : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchVersionnQuery: async(searchData) => {
        try{
            let query = `select * from MAVVERSION where CMARCA = @cmarca and CMODELO = @cmodelo and BACTIVO =`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                .input('cmodelo', sql.Int, searchData.cmodelo ? searchData.cmodelo : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyVersionNameToCreateQuery: async(versionData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                .input('cmarca', sql.Int, versionData.cmarca)
                .input('cmodelo', sql.Int, versionData.cmodelo)
                .input('xversion', sql.NVarChar, versionData.xversion)
                .query('select * from MAVERSION where XVERSION = @xversion and CMARCA = @cmarca and CMODELO = @cmodelo and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createVersionQuery: async(versionData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cmarca', sql.Int, versionData.cmarca)
                .input('cmodelo', sql.Int, versionData.cmodelo)
                .input('xversion', sql.NVarChar, versionData.xversion)
                .input('npasajero', sql.Int, versionData.npasajero)
                .input('xtransmision', sql.NVarChar, versionData.xtransmision)
                .input('bactivo', sql.Bit, versionData.bactivo)
                .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                .input('cano', sql.Numeric(4, 0), versionData.cano)
                .input('cusuariocreacion', sql.Int, versionData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAVERSION ( CMARCA, CMODELO, XVERSION,NPASAJERO, XTRANSMISION, BACTIVO, CPAIS, CANO, CUSUARIOCREACION, FCREACION) values ( @cmarca, @cmodelo,@xversion, @npasajero, @xtransmision, @bactivo, @cpais, @cano,@cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xversion', sql.NVarChar, versionData.xversion)
                    .input('cmarca', sql.Int, versionData.cmarca)
                    .input('cmodelo', sql.Int, versionData.cmodelo)
                    .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                    .query('select * from MAVERSION where XVERSION = @xversion and CMARCA = @cmarca and CMODELO = @cmodelo and CPAIS = @cpais');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getVersionDataQuery: async(versionData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                .input('cversion', sql.Int, versionData.cversion)
                .query('select * from MAVERSION where CPAIS = @cpais and CVERSION = @cversion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyVersionNameToUpdateQuery: async(versionData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                .input('xversion', sql.NVarChar, versionData.xversion)
                .input('cversion', sql.Int, versionData.cversion)
                .input('cmodelo', sql.Int, versionData.cmodelo)
                .input('cmarca', sql.Int, versionData.cmarca)
                .query('select * from MAVERSION where XVERSION = @xversion and CVERSION ! = @cversion and CPAIS = @cpais and CMARCA = @cmarca and CMODELO = @cmodelo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateVersionQuery: async(versionData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cversion', sql.Int, versionData.cversion)
                .input('xversion', sql.NVarChar, versionData.xversion)
                .input('cmarca', sql.Int, versionData.cmarca)
                .input('cmodelo', sql.Int, versionData.cmodelo)
                .input('xtransmision', sql.NVarChar, versionData.xtransmision)
                .input('npasajero', sql.Int, versionData.npasajero)
                .input('bactivo', sql.Bit, versionData.bactivo)
                .input('cpais', sql.Numeric(4, 0), versionData.cpais)
                .input('cusuariocreacion', sql.Int, versionData.cusuariocreacion)
                .input('cusuariomodificacion', sql.Int, versionData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAVERSION set XVERSION = @xversion, XTRANSMISION= @xtransmision, NPASAJERO = @npasajero,  BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CVERSION = @cversion and CPAIS = @cpais and CMARCA = @cmarca and CMODELO = @cmodelo');            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    transmissionTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CTIPOTRANSMISION, XTIPOTRANSMISION, BACTIVO from MATIPOTRANSMISION where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    vehicleTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CTIPOVEHICULO, XTIPOVEHICULO, BACTIVO from MATIPOVEHICULO where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    vehicleDataValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select * from MATIPOVEHICULO where CPAIS = @cpais and BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    ClaseDataValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select * from MACLASES where BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    replacementTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOREPUESTO, XTIPOREPUESTO, BACTIVO from MATIPOREPUESTO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchReplacementQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARREPUESTODATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ctiporepuesto ? " and CTIPOREPUESTO = @ctiporepuesto" : '' }${ searchData.xrepuesto ? " and XREPUESTO like '%" + searchData.xrepuesto + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ctiporepuesto', sql.Int, searchData.ctiporepuesto ? searchData.ctiporepuesto : undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyReplacementNameToCreateQuery: async(replacementData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                .input('ccompania', sql.Int, replacementData.ccompania)
                .input('ctiporepuesto', sql.Int, replacementData.ctiporepuesto)
                .input('xrepuesto', sql.NVarChar, replacementData.xrepuesto)
                .query('select * from MAREPUESTO where XREPUESTO = @xrepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOREPUESTO = @ctiporepuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createReplacementQuery: async(replacementData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xrepuesto', sql.NVarChar, replacementData.xrepuesto)
                .input('bactivo', sql.Bit, replacementData.bactivo)
                .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                .input('ccompania', sql.Int, replacementData.ccompania)
                .input('ctiporepuesto', sql.Int, replacementData.ctiporepuesto)
                .input('cusuariocreacion', sql.Int, replacementData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAREPUESTO (XREPUESTO, CTIPOREPUESTO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xrepuesto, @ctiporepuesto, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xrepuesto', sql.NVarChar, replacementData.xrepuesto)
                    .input('ctiporepuesto', sql.Int, replacementData.ctiporepuesto)
                    .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                    .input('ccompania', sql.Int, replacementData.ccompania)
                    .query('select * from MAREPUESTO where XREPUESTO = @xrepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOREPUESTO = @ctiporepuesto');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getReplacementDataQuery: async(replacementData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                .input('ccompania', sql.Int, replacementData.ccompania)
                .input('crepuesto', sql.Int, replacementData.crepuesto)
                .query('select * from MAREPUESTO where CPAIS = @cpais and CREPUESTO = @crepuesto and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyReplacementNameToUpdateQuery: async(replacementData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                .input('ccompania', sql.Int, replacementData.ccompania)
                .input('crepuesto', sql.Int, replacementData.crepuesto)
                .input('xrepuesto', sql.NVarChar, replacementData.xrepuesto)
                .input('ctiporepuesto', sql.Int, replacementData.ctiporepuesto)
                .query('select * from MAREPUESTO where XREPUESTO = @xrepuesto and CREPUESTO != @crepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOREPUESTO = @ctiporepuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateReplacementQuery: async(replacementData) => { 
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), replacementData.cpais)
                .input('ccompania', sql.Int, replacementData.ccompania)
                .input('crepuesto', sql.Int, replacementData.crepuesto)
                .input('xrepuesto', sql.NVarChar, replacementData.xrepuesto)
                .input('ctiporepuesto', sql.NVarChar, replacementData.ctiporepuesto)
                .input('bactivo', sql.Bit, replacementData.bactivo)
                .input('cusuariomodificacion', sql.Int, replacementData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAREPUESTO set XREPUESTO = @xrepuesto, CTIPOREPUESTO = @ctiporepuesto, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CREPUESTO = @crepuesto and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getCancellationCausesByProcessDataQuery: async(cproceso) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproceso', sql.Int, cproceso)
                .query('select * from VWBUSCARCAUSAANULACIONXPROCESODATA where CPROCESO = @cproceso');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getGeneralStatusByProcessDataQuery: async(cproceso) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproceso', sql.Int, cproceso)
                .query('select * from VWBUSCARESTATUSGENERALXPROCESODATA where CPROCESO = @cproceso');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getDocumentsByProcessDataQuery: async(cproceso) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproceso', sql.Int, cproceso)
                .query('select * from VWBUSCARDOCUMENTOXPROCESODATA where CPROCESO = @cproceso');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    cancellationCauseValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCAUSAANULACION, XCAUSAANULACION, BACTIVO from MACAUSAANULACION where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    generalStatusValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CESTATUSGENERAL, XESTATUSGENERAL, BACTIVO from MAESTATUSGENERAL where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    documentValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CDOCUMENTO, XDOCUMENTO, BACTIVO from MADOCUMENTO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCancellationCauseByProcessUpdateQuery: async(cancellationCauses, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < cancellationCauses.length; i++){
                let insert = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('ccausaanulacion', sql.Int, cancellationCauses[i].ccausaanulacion)
                    .input('cusuariocreacion', sql.Int, processData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNCAUSAANULACIONPROCESO (CPROCESO, CCAUSAANULACION, CUSUARIOCREACION, FCREACION) values (@cproceso, @ccausaanulacion, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateCancellationCauseByProcessUpdateQuery: async(cancellationCauses, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < cancellationCauses.length; i++){
                let update = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('ccausaanulacion', sql.Int, cancellationCauses[i].ccausaanulacion)
                    .input('cusuariomodificacion', sql.Int, processData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNCAUSAANULACIONPROCESO set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROCESO = @cproceso and CCAUSAANULACION = @ccausaanulacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteCancellationCauseByProcessUpdateQuery: async(cancellationCauses, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < cancellationCauses.length; i++){
                let erase = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('ccausaanulacion', sql.Int, cancellationCauses[i].ccausaanulacion)
                    .query('delete from CNCAUSAANULACIONPROCESO where CCAUSAANULACION = @ccausaanulacion and CPROCESO = @cproceso');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createGeneralStatusByProcessUpdateQuery: async(generalStatus, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < generalStatus.length; i++){
                let insert = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cestatusgeneral', sql.Int, generalStatus[i].cestatusgeneral)
                    .input('bdefault', sql.Bit, generalStatus[i].bdefault)
                    .input('cgrupo', sql.Int, generalStatus[i].cgrupo ? generalStatus[i].cgrupo : null)
                    .input('cmodulo', sql.Int, generalStatus[i].cmodulo ? generalStatus[i].cmodulo : null)
                    .input('bgestionable', sql.Bit, generalStatus[i].bgestionable)
                    .input('cusuariocreacion', sql.Int, processData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNESTATUSPROCESO (CPROCESO, CESTATUSGENERAL, BDEFAULT, CGRUPO, CMODULO, BGESTIONABLE, CUSUARIOCREACION, FCREACION) values (@cproceso, @cestatusgeneral, @bdefault, @cgrupo, @cmodulo, @bgestionable, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateGeneralStatusByProcessUpdateQuery: async(generalStatus, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < generalStatus.length; i++){
                let update = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cestatusgeneral', sql.Int, generalStatus[i].cestatusgeneral)
                    .input('bdefault', sql.Bit, generalStatus[i].bdefault)
                    .input('cgrupo', sql.Int, generalStatus[i].cgrupo ? generalStatus[i].cgrupo : null)
                    .input('cmodulo', sql.Int, generalStatus[i].cmodulo ? generalStatus[i].cmodulo : null)
                    .input('bgestionable', sql.Bit, generalStatus[i].bgestionable)
                    .input('cusuariomodificacion', sql.Int, processData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNESTATUSPROCESO set BDEFAULT = @bdefault, CGRUPO = @cgrupo, CMODULO = @cmodulo, BGESTIONABLE = @bgestionable, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROCESO = @cproceso and CESTATUSGENERAL = @cestatusgeneral');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteGeneralStatusByProcessUpdateQuery: async(generalStatus, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < generalStatus.length; i++){
                let erase = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cestatusgeneral', sql.Int, generalStatus[i].cestatusgeneral)
                    .query('delete from CNESTATUSPROCESO where CESTATUSGENERAL = @cestatusgeneral and CPROCESO = @cproceso');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createDocumentByProcessUpdateQuery: async(documents, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let insert = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cdocumento', sql.Int, documents[i].cdocumento)
                    .input('cusuariocreacion', sql.Int, processData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNDOCUMENTOPROCESO (CPROCESO, CDOCUMENTO, CUSUARIOCREACION, FCREACION) values (@cproceso, @cdocumento, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateDocumentByProcessUpdateQuery: async(documents, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let update = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cdocumento', sql.Int, documents[i].cdocumento)
                    .input('cusuariomodificacion', sql.Int, processData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNDOCUMENTOPROCESO set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROCESO = @cproceso and CDOCUMENTO = @cdocumento');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteDocumentByProcessUpdateQuery: async(documents, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let erase = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cdocumento', sql.Int, documents[i].cdocumento)
                    .query('delete from CNDOCUMENTOPROCESO where CDOCUMENTO = @cdocumento and CPROCESO = @cproceso');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    paymentTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOPAGO, XTIPOPAGO, BACTIVO from MATIPOPAGO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getTaxConfigurationDataQuery: async(cimpuesto) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cimpuesto', sql.Int, cimpuesto)
                .query('select * from CNIMPUESTO WHERE CIMPUESTO = @cimpuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchTax: async(cimpuesto) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cimpuesto', sql.Int, cimpuesto ? cimpuesto : 13)
                .query('select * from CNIMPUESTO WHERE CIMPUESTO = @cimpuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateConfigurationTaxQuery: async(taxData) => {
        try{
            let pool = await sql.connect(config);
            let query = await pool.request()
                .input('cimpuesto', sql.Int, taxData.cimpuesto)
                .query('select * from CNIMPUESTO where CIMPUESTO = @cimpuesto');
            if(query.rowsAffected > 0){
                let update = await pool.request()
                    .input('cimpuesto', sql.Int, taxData.cimpuesto)
                    .input('pimpuesto', sql.Numeric(5, 2), taxData.pimpuesto)
                    .input('ctipopago', sql.Int, taxData.ctipopago)
                    .input('fdesde', sql.DateTime, taxData.fdesde)
                    .input('fhasta', sql.DateTime, taxData.fhasta)
                    .input('mdesde', sql.Numeric(11, 2), taxData.mdesde)
                    .input('mhasta', sql.Numeric(11, 2), taxData.mhasta)
                    .input('cusuariomodificacion', sql.Int, taxData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNIMPUESTO set PIMPUESTO = @pimpuesto, CTIPOPAGO = @ctipopago, FDESDE = @fdesde, FHASTA = @fhasta, MDESDE = @mdesde, MHASTA = @mhasta, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion where CIMPUESTO = @cimpuesto');
                //sql.close();
                return { result: update };
            }else{
                let insert = await pool.request()
                    .input('cimpuesto', sql.Int, taxData.cimpuesto)
                    .input('pimpuesto', sql.Numeric(5, 2), taxData.pimpuesto)
                    .input('ctipopago', sql.Int, taxData.ctipopago)
                    .input('fdesde', sql.DateTime, taxData.fdesde)
                    .input('fhasta', sql.DateTime, taxData.fhasta)
                    .input('mdesde', sql.Numeric(11, 2), taxData.mdesde)
                    .input('mhasta', sql.Numeric(11, 2), taxData.mhasta)
                    .input('cusuariocreacion', sql.Int, taxData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNIMPUESTO (CIMPUESTO, PIMPUESTO, CTIPOPAGO, FDESDE, FHASTA, MDESDE, MHASTA, FCREACION, CUSUARIOCREACION) values (@cimpuesto, @pimpuesto, @ctipopago, @fdesde, @fhasta, @mdesde, @mhasta, @fcreacion, @cusuariocreacion)');
                //sql.close();
                return { result: insert };
            }
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchAssociateQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARASOCIADODATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xasociado ? " and XASOCIADO like '%" + searchData.xasociado + "%'" : '' }${ searchData.ctipoasociado ? " and CTIPOASOCIADO = @ctipoasociado" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xrazonsocial ? " and XRAZONSOCIAL like '%" + searchData.xrazonsocial + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipoasociado', sql.Int, searchData.ctipoasociado ? searchData.ctipoasociado : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAssociateNameToCreateQuery: async(associateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                .input('ccompania', sql.Int, associateData.ccompania)
                .input('ctipoasociado', sql.Int, associateData.ctipoasociado)
                .input('xasociado', sql.NVarChar, associateData.xasociado)
                .query('select * from TRASOCIADO where XASOCIADO = @xasociado and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOASOCIADO = @ctipoasociado');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createAssociateQuery: async(associateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xasociado', sql.NVarChar, associateData.xasociado)
                .input('xfax', sql.NVarChar, associateData.xfax ? associateData.xfax : null)
                .input('ctipoasociado', sql.Int, associateData.ctipoasociado)
                .input('ctipodocidentidad', sql.Int, associateData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, associateData.xdocidentidad)
                .input('xrazonsocial', sql.NVarChar, associateData.xrazonsocial)
                .input('xtelefono', sql.NVarChar, associateData.xtelefono)
                .input('xdireccion', sql.NVarChar, associateData.xdireccion)
                .input('xobservacion', sql.NVarChar, associateData.xobservacion)
                .input('bactivo', sql.Bit, associateData.bactivo)
                .input('baseguradora', sql.Bit, associateData.baseguradora)
                .input('fbaja', sql.DateTime, associateData.fbaja)
                .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                .input('ccompania', sql.Int, associateData.ccompania)
                .input('cusuariocreacion', sql.Int, associateData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TRASOCIADO (XASOCIADO, XFAX, CTIPOASOCIADO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XRAZONSOCIAL, XTELEFONO, XDIRECCION, XOBSERVACION, BACTIVO, BASEGURADORA, FBAJA, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xasociado, @xfax, @ctipoasociado, @ctipodocidentidad, @xdocidentidad, @xrazonsocial, @xtelefono, @xdireccion, @xobservacion, @bactivo, @baseguradora, @fbaja, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xasociado', sql.NVarChar, associateData.xasociado)
                    .input('ctipoasociado', sql.Int, associateData.ctipoasociado)
                    .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                    .input('ccompania', sql.Int, associateData.ccompania)
                    .query('select * from TRASOCIADO where XASOCIADO = @xasociado and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOASOCIADO = @ctipoasociado');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getAssociateDataQuery: async(associateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                .input('ccompania', sql.Int, associateData.ccompania)
                .input('casociado', sql.Int, associateData.casociado)
                .query('select * from TRASOCIADO where CPAIS = @cpais and CASOCIADO = @casociado and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyAssociateNameToUpdateQuery: async(associateData) => { 
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                .input('ccompania', sql.Int, associateData.ccompania)
                .input('xasociado', sql.NVarChar, associateData.xasociado)
                .input('casociado', sql.Int, associateData.casociado)
                .input('ctipoasociado', sql.Int, associateData.ctipoasociado)
                .query('select * from TRASOCIADO where XASOCIADO = @xasociado and CASOCIADO != @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOASOCIADO = @ctipoasociado');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateAssociateQuery: async(associateData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), associateData.cpais)
                .input('ccompania', sql.Int, associateData.ccompania)
                .input('casociado', sql.Int, associateData.casociado)
                .input('xasociado', sql.NVarChar, associateData.xasociado)
                .input('xfax', sql.NVarChar, associateData.xfax ? associateData.xfax : null)
                .input('ctipoasociado', sql.Int, associateData.ctipoasociado)
                .input('ctipodocidentidad', sql.Int, associateData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, associateData.xdocidentidad)
                .input('xrazonsocial', sql.NVarChar, associateData.xrazonsocial)
                .input('xtelefono', sql.NVarChar, associateData.xtelefono)
                .input('xdireccion', sql.NVarChar, associateData.xdireccion)
                .input('xobservacion', sql.NVarChar, associateData.xobservacion)
                .input('bactivo', sql.Bit, associateData.bactivo)
                .input('baseguradora', sql.Bit, associateData.baseguradora)
                .input('fbaja', sql.DateTime, associateData.fbaja)
                .input('cusuariomodificacion', sql.Int, associateData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update TRASOCIADO set XASOCIADO = @xasociado, XFAX = @xfax, CTIPOASOCIADO = @ctipoasociado, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XRAZONSOCIAL = @xrazonsocial, XTELEFONO = @xtelefono, XDIRECCION = @xdireccion, XOBSERVACION = @xobservacion, BACTIVO = @bactivo, BASEGURADORA = @baseguradora, FBAJA = @fbaja, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CASOCIADO = @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    documentTypeValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CTIPODOCIDENTIDAD, XTIPODOCIDENTIDAD, BACTIVO from MATIPODOCIDENTIDAD');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    associateTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOASOCIADO, XTIPOASOCIADO, BACTIVO from MATIPOASOCIADO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    businessActivityValrepQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select CACTIVIDADEMPRESA, XACTIVIDADEMPRESA, BACTIVO from MAACTIVIDADEMPRESA where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    cityValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais: 58)
                .input('cestado', sql.Int, searchData.cestado)
                .query('select CCIUDAD, XCIUDAD, BACTIVO from MACIUDAD where CESTADO = @cestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    townshipValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cciudad', sql.Int, searchData.cciudad)
                .input('cestado', sql.Int, searchData.cestado)
                .query('select * from MACORREGIMIENTOS where CESTADO = @cestado and CCIUDAD = @cciudad');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchBrokerQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCORREDORDATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xnombre ? " and XNOMBRE like '%" + searchData.xnombre + "%'" : '' }${ searchData.cactividadempresa ? " and CACTIVIDADEMPRESA = @cactividadempresa" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xapellido ? " and XAPELLIDO like '%" + searchData.xapellido + "%'" : '' }${ searchData.ncorredor ? " and NCORREDOR = @ncorredor" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('cactividadempresa', sql.Int, searchData.cactividadempresa ? searchData.cactividadempresa : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xnombre', sql.NVarChar, searchData.xnombre ? searchData.xnombre : 1)
                .input('xapellido', sql.NVarChar, searchData.xapellido ? searchData.xapellido : 1)
                .input('ncorredor', sql.NVarChar, searchData.ncorredor ? searchData.ncorredor : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    codeBrokerQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select MAX(CCORREDOR) AS CCORREDOR from MACORREDORES');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrokerNumberToCreateQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ncorredor', sql.NVarChar, brokerData.ncorredor)
                .query('select * from MACORREDORES where NCORREDOR = @ncorredor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrokerIdentificationToCreateQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ctipodocidentidad', sql.Int, brokerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, brokerData.xdocidentidad)
                .query('select * from MACORREDORES where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBrokerQuery: async(brokerData, ccorredor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('cactividadempresa', sql.Int, brokerData.cactividadempresa)
                .input('ctipodocidentidad', sql.Int, brokerData.ctipodocidentidad)
                .input('cestado', sql.Int, brokerData.cestado)
                .input('cciudad', sql.Int, brokerData.cciudad)
                .input('ccorredor', sql.Int, ccorredor)
                .input('ncorredor', sql.NVarChar, ccorredor)
                .input('xcorredor', sql.NVarChar, brokerData.xcorredor)
                .input('xdocidentidad', sql.NVarChar, brokerData.xdocidentidad)
                .input('xtelefono', sql.NVarChar, brokerData.xtelefono)
                .input('xemail', sql.NVarChar, brokerData.xemail)
                .input('xdireccion', sql.NVarChar, brokerData.xdireccion)
                .input('bactivo', sql.Bit, brokerData.bactivo)
                .input('cusuariocreacion', sql.Int, brokerData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACORREDORES (CCORREDOR, CACTIVIDADEMPRESA, CTIPODOCIDENTIDAD, CESTADO, CCIUDAD, NCORREDOR, XCORREDOR, XDOCIDENTIDAD, XTELEFONO, XEMAIL, XDIRECCION, CPAIS, CCOMPANIA, BACTIVO, CUSUARIOCREACION, FCREACION) values (@ccorredor, @cactividadempresa, @ctipodocidentidad, @cestado, @cciudad, @ncorredor, @xcorredor, @xdocidentidad, @xtelefono, @xemail, @xdireccion, @cpais, @ccompania, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                    .input('ccompania', sql.Int, brokerData.ccompania)
                    .input('ctipodocidentidad', sql.Int, brokerData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, brokerData.xdocidentidad)
                    .query('select * from MACORREDORES where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && brokerData.banks){
                    for(let i = 0; i < brokerData.banks.length; i++){
                        let insert = await pool.request()
                            .input('ccorredor', sql.Int, query.recordset[0].CCORREDOR)
                            .input('cbanco', sql.Int, brokerData.banks[i].cbanco)
                            .input('ctipocuentabancaria', sql.Int, brokerData.banks[i].ctipocuentabancaria)
                            .input('xnumerocuenta', sql.NVarChar, brokerData.banks[i].xnumerocuenta)
                            .input('cusuariocreacion', sql.Int, brokerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into TRBANCOCORREDOR (CCORREDOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, CUSUARIOCREACION, FCREACION) values (@ccorredor, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){

            return { error: err.message };
        }
    },
    bankValrepQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select CBANCO, XBANCO, BACTIVO from MABANCO where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    bankAccountTypeValrepQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select CTIPOCUENTABANCARIA, XTIPOCUENTABANCARIA, BACTIVO from MATIPOCUENTABANCARIA where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getBrokerDataQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ccorredor', sql.Int, brokerData.ccorredor)
                .query('select * from MACORREDORES where CCORREDOR = @ccorredor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getBrokerBanksDataQuery: async(ccorredor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccorredor', sql.Int, ccorredor)
                .query('select * from VWBUSCARBANCOSXCORREDORDATA where CCORREDOR = @ccorredor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrokerNumberToUpdateQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ncorredor', sql.NVarChar, brokerData.ncorredor)
                .input('ccorredor', sql.Int, brokerData.ccorredor)
                .query('select * from MACORREDORES where NCORREDOR = @ncorredor and CPAIS = @cpais and CCOMPANIA = @ccompania and CCORREDOR != @ccorredor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyBrokerIdentificationToUpdateQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ccorredor', sql.NVarChar, brokerData.ccorredor)
                .input('ctipodocidentidad', sql.Int, brokerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, brokerData.xdocidentidad)
                .query('select * from MACORREDORES where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CCORREDOR != @ccorredor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateBrokerQuery: async(brokerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), brokerData.cpais)
                .input('ccompania', sql.Int, brokerData.ccompania)
                .input('ccorredor', sql.Int, brokerData.ccorredor)
                .input('cactividadempresa', sql.Int, brokerData.cactividadempresa)
                .input('ctipodocidentidad', sql.Int, brokerData.ctipodocidentidad)
                .input('cestado', sql.Int, brokerData.cestado)
                .input('cciudad', sql.Int, brokerData.cciudad)
                .input('ncorredor', sql.NVarChar, brokerData.ncorredor)
                .input('xcorredor', sql.NVarChar, brokerData.xnombre)
                .input('xdocidentidad', sql.NVarChar, brokerData.xdocidentidad)
                .input('xtelefono', sql.NVarChar, brokerData.xtelefono)
                .input('xemail', sql.NVarChar, brokerData.xemail)
                .input('xdireccion', sql.NVarChar, brokerData.xdireccion)
                .input('bactivo', sql.Bit, brokerData.bactivo)
                .input('cusuariomodificacion', sql.Int, brokerData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACORREDORES set CACTIVIDADEMPRESA = @cactividadempresa, CTIPODOCIDENTIDAD = @ctipodocidentidad, CESTADO = @cestado, CCIUDAD = @cciudad, NCORREDOR = @ncorredor, XCORREDOR = @xcorredor, XDOCIDENTIDAD = @xdocidentidad, XTELEFONO = @xtelefono, XEMAIL = @xemail, XDIRECCION = @xdireccion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCORREDOR = @ccorredor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    createBanksByBrokerUpdateQuery: async(banks, brokerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let insert = await pool.request()
                    .input('ccorredor', sql.Int, brokerData.ccorredor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .input('ctipocuentabancaria', sql.Int, banks[i].ctipocuentabancaria)
                    .input('xnumerocuenta', sql.NVarChar, banks[i].xnumerocuenta)
                    .input('cusuariocreacion', sql.Int, brokerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRBANCOCORREDOR (CCORREDOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, CUSUARIOCREACION, FCREACION) values (@ccorredor, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateBanksByBrokerUpdateQuery: async(banks, brokerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let update = await pool.request()
                    .input('ccorredor', sql.Int, brokerData.ccorredor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .input('ctipocuentabancaria', sql.Int, banks[i].ctipocuentabancaria)
                    .input('xnumerocuenta', sql.NVarChar, banks[i].xnumerocuenta)
                    .input('cusuariomodificacion', sql.Int, brokerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update TRBANCOCORREDOR set CTIPOCUENTABANCARIA = @ctipocuentabancaria, XNUMEROCUENTA = @xnumerocuenta, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CBANCO = @cbanco and CCORREDOR = @ccorredor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteBanksByBrokerUpdateQuery: async(banks, brokerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let erase = await pool.request()
                    .input('ccorredor', sql.Int, brokerData.ccorredor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .query('delete from TRBANCOCORREDOR where CBANCO = @cbanco and CCORREDOR = @ccorredor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchEnterpriseQuery: async(searchData) => {
        try{
            let query = `select * from TREMPRESA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xnombre ? " and XNOMBRE like '%" + searchData.xnombre + "%'" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xrazonsocial ? " and XRAZONSOCIAL like '%" + searchData.xrazonsocial + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xnombre', sql.NVarChar, searchData.xnombre ? searchData.xnombre : 1)
                .input('xrazonsocial', sql.NVarChar, searchData.xrazonsocial ? searchData.xrazonsocial : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyEnterpriseIdentificationToCreateQuery: async(enterpriseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                .input('ccompania', sql.Int, enterpriseData.ccompania)
                .input('ctipodocidentidad', sql.Int, enterpriseData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, enterpriseData.xdocidentidad)
                .query('select * from TREMPRESA where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createEnterpriseQuery: async(enterpriseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                .input('ccompania', sql.Int, enterpriseData.ccompania)
                .input('ctipodocidentidad', sql.Int, enterpriseData.ctipodocidentidad)
                .input('cestado', sql.Int, enterpriseData.cestado)
                .input('cciudad', sql.Int, enterpriseData.cciudad)
                .input('xnombre', sql.NVarChar, enterpriseData.xnombre)
                .input('xrazonsocial', sql.NVarChar, enterpriseData.xrazonsocial)
                .input('xdocidentidad', sql.NVarChar, enterpriseData.xdocidentidad)
                .input('xtelefono', sql.NVarChar, enterpriseData.xtelefono)
                .input('xfax', sql.NVarChar, enterpriseData.xfax ? enterpriseData.xfax : null)
                .input('xrutaimagen', sql.NVarChar, enterpriseData.xrutaimagen ? enterpriseData.xrutaimagen : null)
                .input('xdireccion', sql.NVarChar, enterpriseData.xdireccion)
                .input('bactivo', sql.Bit, enterpriseData.bactivo)
                .input('cusuariocreacion', sql.Int, enterpriseData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TREMPRESA (CTIPODOCIDENTIDAD, CESTADO, CCIUDAD, XNOMBRE, XRAZONSOCIAL, XDOCIDENTIDAD, XTELEFONO, XFAX, XRUTAIMAGEN, XDIRECCION, CPAIS, CCOMPANIA, BACTIVO, CUSUARIOCREACION, FCREACION) values (@ctipodocidentidad, @cestado, @cciudad, @xnombre, @xrazonsocial, @xdocidentidad, @xtelefono, @xfax, @xrutaimagen, @xdireccion, @cpais, @ccompania, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                    .input('ccompania', sql.Int, enterpriseData.ccompania)
                    .input('ctipodocidentidad', sql.Int, enterpriseData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, enterpriseData.xdocidentidad)
                    .query('select * from TREMPRESA where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getEnterpriseDataQuery: async(enterpriseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                .input('ccompania', sql.Int, enterpriseData.ccompania)
                .input('cempresa', sql.Int, enterpriseData.cempresa)
                .query('select * from TREMPRESA where CEMPRESA = @cempresa and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyEnterpriseIdentificationToUpdateQuery: async(enterpriseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                .input('ccompania', sql.Int, enterpriseData.ccompania)
                .input('cempresa', sql.NVarChar, enterpriseData.cempresa)
                .input('ctipodocidentidad', sql.Int, enterpriseData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, enterpriseData.xdocidentidad)
                .query('select * from TREMPRESA where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CEMPRESA != @cempresa');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateEnterpriseQuery: async(enterpriseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), enterpriseData.cpais)
                .input('ccompania', sql.Int, enterpriseData.ccompania)
                .input('cempresa', sql.Int, enterpriseData.cempresa)
                .input('ctipodocidentidad', sql.Int, enterpriseData.ctipodocidentidad)
                .input('cestado', sql.Int, enterpriseData.cestado)
                .input('cciudad', sql.Int, enterpriseData.cciudad)
                .input('xnombre', sql.NVarChar, enterpriseData.xnombre)
                .input('xrazonsocial', sql.NVarChar, enterpriseData.xrazonsocial)
                .input('xdocidentidad', sql.NVarChar, enterpriseData.xdocidentidad)
                .input('xtelefono', sql.NVarChar, enterpriseData.xtelefono)
                .input('xfax', sql.NVarChar, enterpriseData.xfax ? enterpriseData.xfax : null)
                .input('xrutaimagen', sql.NVarChar, enterpriseData.xrutaimagen ? enterpriseData.xrutaimagen : null)
                .input('xdireccion', sql.NVarChar, enterpriseData.xdireccion)
                .input('bactivo', sql.Bit, enterpriseData.bactivo)
                .input('cusuariomodificacion', sql.Int, enterpriseData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update TREMPRESA set CTIPODOCIDENTIDAD = @ctipodocidentidad, CESTADO = @cestado, CCIUDAD = @cciudad, XNOMBRE = @xnombre, XRAZONSOCIAL = @xrazonsocial, XDOCIDENTIDAD = @xdocidentidad, XTELEFONO = @xtelefono, XFAX = @xfax, XRUTAIMAGEN = @xrutaimagen, XDIRECCION = @xdireccion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CEMPRESA = @cempresa and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchProviderQuery: async(searchData) => {
        try{
            let query = `select * from PRPROVEEDORES WHERE CCOMPANIA = @ccompania`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                //.input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                //.input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                //.input('xproveedor', sql.NVarChar, searchData.xproveedor ? searchData.xproveedor : 1)
                //.input('xrazonsocial', sql.NVarChar, searchData.xrazonsocial ? searchData.xrazonsocial : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProviderIdentificationToCreateQuery: async(providerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                .input('ccompania', sql.Int, providerData.ccompania)
                .input('ctipodocidentidad', sql.Int, providerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, providerData.xdocidentidad)
                .query('select * from PRPROVEEDOR where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createProviderQuery: async(providerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                .input('ccompania', sql.Int, providerData.ccompania)
                .input('ctipodocidentidad', sql.Int, providerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, providerData.xdocidentidad)
                .input('cestado', sql.Int, providerData.cestado)
                .input('cciudad', sql.Int, providerData.cciudad)
                .input('xproveedor', sql.NVarChar, providerData.xproveedor)
                .input('xrazonsocial', sql.NVarChar, providerData.xrazonsocial)
                .input('xtelefono', sql.NVarChar, providerData.xtelefono)
                .input('centeimpuesto', sql.NVarChar, providerData.centeimpuesto)
                .input('ldiascredito', sql.Int, providerData.ldiascredito)
                .input('xemail', sql.NVarChar, providerData.xemail ? providerData.xemail : null)
                .input('xfax', sql.NVarChar, providerData.xfax ? providerData.xfax : null)
                .input('pretencion', sql.Numeric(5, 2), providerData.pretencion ? providerData.pretencion : null)
                .input('xpaginaweb', sql.NVarChar, providerData.xpaginaweb ? providerData.xpaginaweb : null)
                .input('xdireccion', sql.NVarChar, providerData.xdireccion)
                .input('xdireccioncorreo', sql.NVarChar, providerData.xdireccioncorreo)
                .input('xobservacion', sql.NVarChar, providerData.xobservacion)
                .input('bafiliado', sql.Bit, providerData.bafiliado)
                .input('bactivo', sql.Bit, providerData.bactivo)
                .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into PRPROVEEDOR (CPAIS, CCOMPANIA, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, CESTADO, CCIUDAD, XPROVEEDOR, XRAZONSOCIAL, XTELEFONO, CENTEIMPUESTO, LDIASCREDITO, XEMAIL, XFAX, PRETENCION, XPAGINAWEB, XDIRECCION, XDIRECCIONCORREO, XOBSERVACION, BAFILIADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ctipodocidentidad, @xdocidentidad, @cestado, @cciudad, @xproveedor, @xrazonsocial, @xtelefono, @centeimpuesto, @ldiascredito, @xemail, @xfax, @pretencion, @xpaginaweb, @xdireccion, @xdireccioncorreo, @xobservacion, @bafiliado, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                    .input('ccompania', sql.Int, providerData.ccompania)
                    .input('ctipodocidentidad', sql.Int, providerData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, providerData.xdocidentidad)
                    .query('select * from PRPROVEEDOR where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && providerData.banks){
                    for(let i = 0; i < providerData.banks.length; i++){
                        let insert = await pool.request()
                            .input('cproveedor', sql.Int, query.recordset[0].CPROVEEDOR)
                            .input('cbanco', sql.Int, providerData.banks[i].cbanco)
                            .input('ctipocuentabancaria', sql.Int, providerData.banks[i].ctipocuentabancaria)
                            .input('xnumerocuenta', sql.NVarChar, providerData.banks[i].xnumerocuenta)
                            .input('bprincipal', sql.Bit, providerData.banks[i].bprincipal)
                            .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into PRBANCO (CPROVEEDOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @bprincipal, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(query.rowsAffected > 0 && providerData.contacts){
                    for(let i = 0; i < providerData.contacts.length; i++){
                        let insert = await pool.request()
                            .input('cproveedor', sql.Int, query.recordset[0].CPROVEEDOR)
                            .input('xnombre', sql.NVarChar, providerData.contacts[i].xnombre)
                            .input('xapellido', sql.NVarChar, providerData.contacts[i].xapellido)
                            .input('ctipodocidentidad', sql.Int,  providerData.contacts[i].ctipodocidentidad)
                            .input('xdocidentidad', sql.NVarChar, providerData.contacts[i].xdocidentidad)
                            .input('xtelefonocelular', sql.NVarChar, providerData.contacts[i].xtelefonocelular)
                            .input('xemail', sql.NVarChar, providerData.contacts[i].xemail)
                            .input('xcargo', sql.NVarChar, providerData.contacts[i].xcargo ? providerData.contacts[i].xcargo : null)
                            .input('xtelefonooficina', sql.NVarChar, providerData.contacts[i].xtelefonooficina ? providerData.contacts[i].xtelefonooficina : null)
                            .input('xtelefonocasa', sql.NVarChar, providerData.contacts[i].xtelefonocasa ? providerData.contacts[i].xtelefonocasa : null)
                            .input('xfax', sql.NVarChar, providerData.contacts[i].xfax ? providerData.contacts[i].xfax : null)
                            .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into PRCONTACTO (CPROVEEDOR, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XTELEFONOOFICINA, XTELEFONOCASA, XFAX, CUSUARIOCREACION, FCREACION) values (@cproveedor, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xtelefonooficina, @xtelefonocasa, @xfax, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(query.rowsAffected > 0 && providerData.states){
                    for(let i = 0; i < providerData.states.length; i++){
                        let insert = await pool.request()
                            .input('cproveedor', sql.Int, query.recordset[0].CPROVEEDOR)
                            .input('cestado', sql.Int, providerData.states[i].cestado)
                            .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into PRESTADO (CPROVEEDOR, CESTADO, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cestado, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(query.rowsAffected > 0 && providerData.brands){
                    for(let i = 0; i < providerData.brands.length; i++){
                        let insert = await pool.request()
                            .input('cproveedor', sql.Int, query.recordset[0].CPROVEEDOR)
                            .input('cmarca', sql.Int, providerData.brands[i].cmarca)
                            .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into PRMARCA (CPROVEEDOR, CMARCA, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cmarca, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(query.rowsAffected > 0 && providerData.services){
                    for(let i = 0; i < providerData.services.length; i++){
                        let insert = await pool.request()
                            .input('cproveedor', sql.Int, query.recordset[0].CPROVEEDOR)
                            .input('cservicio', sql.Int, providerData.services[i].cservicio)
                            .input('ctiposervicio', sql.Int, providerData.services[i].ctiposervicio)
                            .input('cusuariocreacion', sql.Int, providerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into PRSERVICIO (CPROVEEDOR, CSERVICIO, CTIPOSERVICIO, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cservicio, @ctiposervicio, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    serviceValrepQuery: async(searchData) => {
        try{
            let query = `select * from MASERVICIO where CPAIS = @cpais AND CCOMPANIA = @ccompania`
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    serviceProvidersValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cservicio', sql.Int, searchData.cservicio)
            .input('cestado', sql.Int, searchData.cestado)
            .query('select * from VWBUSCARPROVEEDORESXSERVICIOS WHERE CSERVICIO = @cservicio AND CESTADO = @cestado');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getServiceOrderProviders: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cservicio', sql.Int, searchData.cservicio)
                .input('cestado', sql.Int, searchData.cestado)
                .query('select * from VWBUSCARPROVEEDORESXSERVICIOS WHERE CSERVICIO = @cservicio AND CESTADO = @cestado');
            //sql.close()
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationServices: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARSERVICIOSXNOTIFICACION WHERE cnotificacion = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderDataQuery: async(providerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                .input('ccompania', sql.Int, providerData.ccompania)
                .input('cproveedor', sql.Int, providerData.cproveedor)
                .query('select * from PRPROVEEDOR where CPROVEEDOR = @cproveedor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderBanksDataQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from VWBUSCARBANCOXPROVEEDORDATA where CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderStatesDataQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from VWBUSCARESTADOXPROVEEDORDATA where CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderBrandsDataQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from VWBUSCARMARCAXPROVEEDORDATA where CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderServicesDataQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from VWBUSCARSERVICIOXPROVEEDORDATA where CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getProviderContactsDataQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from PRCONTACTO where CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProviderIdentificationToUpdateQuery: async(providerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                .input('ccompania', sql.Int, providerData.ccompania)
                .input('cproveedor', sql.NVarChar, providerData.cproveedor)
                .input('ctipodocidentidad', sql.Int, providerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, providerData.xdocidentidad)
                .query('select * from PRPROVEEDOR where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CPROVEEDOR != @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateProviderQuery: async(providerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), providerData.cpais)
                .input('ccompania', sql.Int, providerData.ccompania)
                .input('cproveedor', sql.Int, providerData.cproveedor)
                .input('xproveedor', sql.NVarChar, providerData.xproveedor)
                .input('ctipodocidentidad', sql.Int, providerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, providerData.xdocidentidad)
                .input('xrazonsocial', sql.NVarChar, providerData.xrazonsocial)
                .input('cestado', sql.Int, providerData.cestado)
                .input('cciudad', sql.Int, providerData.cciudad)
                .input('xdireccion', sql.NVarChar, providerData.xdireccion)
                .input('xdireccioncorreo', sql.NVarChar, providerData.xdireccioncorreo)
                .input('xtelefono', sql.NVarChar, providerData.xtelefono)
                .input('xfax', sql.NVarChar, providerData.xfax ? providerData.xfax : null)
                .input('pretencion', sql.Numeric(5, 2), providerData.pretencion ? providerData.pretencion : null)
                .input('centeimpuesto', sql.NVarChar, providerData.centeimpuesto)
                .input('ldiascredito', sql.Int, providerData.ldiascredito)
                .input('xemail', sql.NVarChar, providerData.xemail ? providerData.xemail : null)
                .input('bafiliado', sql.Bit, providerData.bafiliado)
                .input('xpaginaweb', sql.NVarChar, providerData.xpaginaweb ? providerData.xpaginaweb : null)
                .input('xobservacion', sql.NVarChar, providerData.xobservacion)
                .input('bactivo', sql.Bit, providerData.bactivo)
                .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update PRPROVEEDOR set XPROVEEDOR = @xproveedor, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XRAZONSOCIAL = @xrazonsocial, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCION = @xdireccion, XDIRECCIONCORREO = @xdireccioncorreo, XTELEFONO = @xtelefono, XFAX = @xfax, PRETENCION = @pretencion, CENTEIMPUESTO = @centeimpuesto, LDIASCREDITO = @ldiascredito, XEMAIL = @xemail, BAFILIADO = @bafiliado, XPAGINAWEB = @xpaginaweb, XOBSERVACION = @xobservacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROVEEDOR = @cproveedor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createBanksByProviderUpdateQuery: async(banks, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let insert = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .input('ctipocuentabancaria', sql.Int, banks[i].ctipocuentabancaria)
                    .input('xnumerocuenta', sql.NVarChar, banks[i].xnumerocuenta)
                    .input('bprincipal', sql.Bit, banks[i].bprincipal)
                    .input('cusuariocreacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into PRBANCO (CPROVEEDOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @bprincipal, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateBanksByProviderUpdateQuery: async(banks, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let update = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .input('ctipocuentabancaria', sql.Int, banks[i].ctipocuentabancaria)
                    .input('xnumerocuenta', sql.NVarChar, banks[i].xnumerocuenta)
                    .input('bprincipal', sql.Bit, banks[i].bprincipal)
                    .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update PRBANCO set CTIPOCUENTABANCARIA = @ctipocuentabancaria, XNUMEROCUENTA = @xnumerocuenta, BPRINCIPAL = @bprincipal, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CBANCO = @cbanco and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteBanksByProviderUpdateQuery: async(banks, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < banks.length; i++){
                let erase = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cbanco', sql.Int, banks[i].cbanco)
                    .query('delete from PRBANCO where CBANCO = @cbanco and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createStatesByProviderUpdateQuery: async(states, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < states.length; i++){
                let insert = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cestado', sql.Int, states[i].cestado)
                    .input('cusuariocreacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into PRESTADO (CPROVEEDOR, CESTADO, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cestado, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateStatesByProviderUpdateQuery: async(states, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < states.length; i++){
                let update = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cestado', sql.Int, states[i].cestado)
                    .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update PRESTADO set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CESTADO = @cestado and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteStatesByProviderUpdateQuery: async(states, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < states.length; i++){
                let erase = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cestado', sql.Int, states[i].cestado)
                    .query('delete from PRESTADO where CESTADO = @cestado and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createBrandsByProviderUpdateQuery: async(brands, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < brands.length; i++){
                let insert = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cmarca', sql.Int, brands[i].cmarca)
                    .input('cusuariocreacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into PRMARCA (CPROVEEDOR, CMARCA, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cmarca, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateBrandsByProviderUpdateQuery: async(brands, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < brands.length; i++){
                let update = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cmarca', sql.Int, brands[i].cmarca)
                    .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update PRMARCA set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CMARCA = @cmarca and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteBrandsByProviderUpdateQuery: async(brands, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < brands.length; i++){
                let erase = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cmarca', sql.Int, brands[i].cmarca)
                    .query('delete from PRMARCA where CMARCA = @cmarca and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createServicesByProviderUpdateQuery: async(services, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let insert = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('cusuariocreacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into PRSERVICIO (CPROVEEDOR, CSERVICIO, CTIPOSERVICIO, CUSUARIOCREACION, FCREACION) values (@cproveedor, @cservicio, @ctiposervicio, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateServicesByProviderUpdateQuery: async(services, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let update = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update PRSERVICIO set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSERVICIO = @cservicio and CTIPOSERVICIO = @ctiposervicio and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteServicesByProviderUpdateQuery: async(services, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let erase = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .query('delete from PRSERVICIO where CSERVICIO = @cservicio and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createContactsByProviderUpdateQuery: async(contacts, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let insert = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('xnombre', sql.NVarChar, contacts[i].xnombre)
                    .input('xapellido', sql.NVarChar, contacts[i].xapellido)
                    .input('ctipodocidentidad', sql.Int, contacts[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, contacts[i].xdocidentidad)
                    .input('xtelefonocelular', sql.NVarChar, contacts[i].xtelefonocelular)
                    .input('xemail', sql.NVarChar, contacts[i].xemail)
                    .input('xcargo', sql.NVarChar, contacts[i].xcargo ? contacts[i].xcargo : null)
                    .input('xfax', sql.NVarChar, contacts[i].xfax ? contacts[i].xfax : null)
                    .input('xtelefonooficina', sql.NVarChar, contacts[i].xtelefonooficina ? contacts[i].xtelefonooficina : null)
                    .input('xtelefonocasa', sql.NVarChar, contacts[i].xtelefonocasa ? contacts[i].xtelefonocasa : null)
                    .input('cusuariocreacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into PRCONTACTO (CPROVEEDOR, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XFAX, XTELEFONOOFICINA, XTELEFONOCASA, CUSUARIOCREACION, FCREACION) values (@cproveedor, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xfax, @xtelefonooficina, @xtelefonocasa, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateContactsByProviderUpdateQuery: async(contacts, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let update = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('ccontacto', sql.Int, contacts[i].ccontacto)
                    .input('xnombre', sql.NVarChar, contacts[i].xnombre)
                    .input('xapellido', sql.NVarChar, contacts[i].xapellido)
                    .input('ctipodocidentidad', sql.Int, contacts[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, contacts[i].xdocidentidad)
                    .input('xtelefonocelular', sql.NVarChar, contacts[i].xtelefonocelular)
                    .input('xemail', sql.NVarChar, contacts[i].xemail)
                    .input('xcargo', sql.NVarChar, contacts[i].xcargo ? contacts[i].xcargo : null)
                    .input('xfax', sql.NVarChar, contacts[i].xfax ? contacts[i].xfax : null)
                    .input('xtelefonooficina', sql.NVarChar, contacts[i].xtelefonooficina ? contacts[i].xtelefonooficina : null)
                    .input('xtelefonocasa', sql.NVarChar, contacts[i].xtelefonocasa ? contacts[i].xtelefonocasa : null)
                    .input('cusuariomodificacion', sql.Int, providerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update PRCONTACTO set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XTELEFONOCELULAR = @xtelefonocelular, XEMAIL = @xemail, XCARGO = @xcargo, XFAX = @xfax, XTELEFONOOFICINA = @xtelefonooficina, XTELEFONOCASA = @xtelefonocasa, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONTACTO = @ccontacto and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteContactsByProviderUpdateQuery: async(contacts, providerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let erase = await pool.request()
                    .input('cproveedor', sql.Int, providerData.cproveedor)
                    .input('ccontacto', sql.Int, contacts[i].ccontacto)
                    .query('delete from PRCONTACTO where CCONTACTO = @ccontacto and CPROVEEDOR = @cproveedor');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message }
        }
    },
    enterpriseValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CEMPRESA, XNOMBRE, BACTIVO from TREMPRESA where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    associateValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CASOCIADO, XASOCIADO, BACTIVO from TRASOCIADO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    brokerValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCORREDOR, XCORREDOR, BACTIVO from MACORREDORES where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    depreciationValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CDEPRECIACION, XDEPRECIACION, BACTIVO from MADEPRECIACION where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    relationshipValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CPARENTESCO, XPARENTESCO, BACTIVO from MAPARENTESCO where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    penaltyValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CPENALIZACION, XPENALIZACION, BACTIVO from MAPENALIZACION where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    providerNotificationValrepQuery: async(cproveedor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from PRPROVEEDORES WHERE CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getModulesByProcessDataQuery: async(cproceso) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproceso', sql.Int, cproceso)
                .query('select * from VWBUSCARMODULOXPROCESODATA where CPROCESO = @cproceso');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createModulesByProcessUpdateQuery: async(modules, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let insert = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cgrupo', sql.Int, modules[i].cgrupo)
                    .input('cmodulo', sql.Int, modules[i].cmodulo)
                    .input('cusuariocreacion', sql.Int, processData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNMODULOPROCESO (CPROCESO, CGRUPO, CMODULO, CUSUARIOCREACION, FCREACION) values (@cproceso, @cgrupo, @cmodulo, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateModulesByProcessUpdateQuery: async(modules, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let update = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cgrupo', sql.Int, modules[i].cgrupo)
                    .input('cmodulo', sql.Int, modules[i].cmodulo)
                    .input('cusuariomodificacion', sql.Int, processData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNMODULOPROCESO set  CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CGRUPO = @cgrupo and CMODULO = @cmodulo and CPROCESO = @cproceso');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteModulesByProcessUpdateQuery: async(modules, processData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < modules.length; i++){
                let erase = await pool.request()
                    .input('cproceso', sql.Int, processData.cproceso)
                    .input('cmodulo', sql.Int, modules[i].cmodulo)
                    .query('delete from CNMODULOPROCESO where CMODULO = @cmodulo and CPROCESO = @cproceso');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    civilStatusValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CESTADOCIVIL, XESTADOCIVIL, BACTIVO from MAESTADOCIVIL where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    processDocumentValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cmodulo', sql.Int, searchData.cmodulo)
                .query('select CDOCUMENTO, XDOCUMENTO, BACTIVO from VWDOCUMENTOXMODULOXPROCESODATA where CPAIS = @cpais and CCOMPANIA = @ccompania and CMODULO = @cmodulo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    planTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOPLAN, XTIPOPLAN, BACTIVO from MATIPOPLAN where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getGrouperDataQuery: async(grouperData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cagrupador', sql.Int, grouperData.cagrupador)
                .query('select * from CLAGRUPADOR where CAGRUPADOR = @cagrupador');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    // clientAssociateByPlanValrepQuery: async(searchData) => {
    //     try{
    //         let pool = await sql.connect(config);
    //         let result = await pool.request()
    //             .input('cplan', sql.Int, searchData.cplan)
    //             .query('select CASOCIADO, XASOCIADO, BACTIVO from VWASOCIADOXCLIENTEXPLANDATA where CPLAN = @cplan');
    //         //sql.close();
    //         return { result: result };
    //     }catch(err){
    //         return { error: err.message };
    //     }
    // },
    serviceDepletionTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOAGOTAMIENTOSERVICIO, XTIPOAGOTAMIENTOSERVICIO, BACTIVO from MATIPOAGOTAMIENTOSERVICIO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCoverageQuery: async(searchData) => {
        try{
            let query = `select * from MACOBERTURA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xcobertura ? " and XCOBERTURA like '%" + searchData.xcobertura + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCoverageNameToCreateQuery: async(coverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                .input('ccompania', sql.Int, coverageData.ccompania)
                .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
                .query('select * from MACOBERTURA where XCOBERTURA = @xcobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCoverageQuery: async(coverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
                .input('bactivo', sql.Bit, coverageData.bactivo)
                .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                .input('ccompania', sql.Int, coverageData.ccompania)
                .input('cusuariocreacion', sql.Int, coverageData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACOBERTURA (XCOBERTURA, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xcobertura, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
                    .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                    .input('ccompania', sql.Int, coverageData.ccompania)
                    .query('select * from MACOBERTURA where XCOBERTURA = @xcobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCoverageDataQuery: async(coverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                .input('ccompania', sql.Int, coverageData.ccompania)
                .input('ccobertura', sql.Int, coverageData.ccobertura)
                .query('select * from MACOBERTURA where CPAIS = @cpais and CCOBERTURA = @ccobertura and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCoverageNameToUpdateQuery: async(coverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                .input('ccompania', sql.Int, coverageData.ccompania)
                .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
                .input('ccobertura', sql.Int, coverageData.ccobertura)
                .query('select * from MACOBERTURA where XCOBERTURA = @xcobertura and CCOBERTURA != @ccobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCoverageQuery: async(coverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageData.cpais)
                .input('ccompania', sql.Int, coverageData.ccompania)
                .input('ccobertura', sql.Int, coverageData.ccobertura)
                .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
                .input('bactivo', sql.Bit, coverageData.bactivo)
                .input('cusuariomodificacion', sql.Int, coverageData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACOBERTURA set XCOBERTURA = @xcobertura, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOBERTURA = @ccobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCoverageConceptQuery: async(searchData) => {
        try{
            let query = `select * from MACONCEPTOCOBERTURA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xconceptocobertura ? " and XCONCEPTOCOBERTURA like '%" + searchData.xconceptocobertura + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCoverageConceptNameToCreateQuery: async(coverageConceptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                .input('ccompania', sql.Int, coverageConceptData.ccompania)
                .input('xconceptocobertura', sql.NVarChar, coverageConceptData.xconceptocobertura)
                .query('select * from MACONCEPTOCOBERTURA where XCONCEPTOCOBERTURA = @xconceptocobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCoverageConceptQuery: async(coverageConceptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xconceptocobertura', sql.NVarChar, coverageConceptData.xconceptocobertura)
                .input('bactivo', sql.Bit, coverageConceptData.bactivo)
                .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                .input('ccompania', sql.Int, coverageConceptData.ccompania)
                .input('cusuariocreacion', sql.Int, coverageConceptData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACONCEPTOCOBERTURA (XCONCEPTOCOBERTURA, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xconceptocobertura, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xconceptocobertura', sql.NVarChar, coverageConceptData.xconceptocobertura)
                    .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                    .input('ccompania', sql.Int, coverageConceptData.ccompania)
                    .query('select * from MACONCEPTOCOBERTURA where XCONCEPTOCOBERTURA = @xconceptocobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getCoverageConceptDataQuery: async(coverageConceptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                .input('ccompania', sql.Int, coverageConceptData.ccompania)
                .input('cconceptocobertura', sql.Int, coverageConceptData.cconceptocobertura)
                .query('select * from MACONCEPTOCOBERTURA where CPAIS = @cpais and CCONCEPTOCOBERTURA = @cconceptocobertura and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyCoverageConceptNameToUpdateQuery: async(coverageConceptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                .input('ccompania', sql.Int, coverageConceptData.ccompania)
                .input('xconceptocobertura', sql.NVarChar, coverageConceptData.xconceptocobertura)
                .input('cconceptocobertura', sql.Int, coverageConceptData.cconceptocobertura)
                .query('select * from MACONCEPTOCOBERTURA where XCONCEPTOCOBERTURA = @xconceptocobertura and CCONCEPTOCOBERTURA != @cconceptocobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCoverageConceptQuery: async(coverageConceptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), coverageConceptData.cpais)
                .input('ccompania', sql.Int, coverageConceptData.ccompania)
                .input('cconceptocobertura', sql.Int, coverageConceptData.cconceptocobertura)
                .input('xconceptocobertura', sql.NVarChar, coverageConceptData.xconceptocobertura)
                .input('bactivo', sql.Bit, coverageConceptData.bactivo)
                .input('cusuariomodificacion', sql.Int, coverageConceptData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACONCEPTOCOBERTURA set XCONCEPTOCOBERTURA = @xconceptocobertura, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONCEPTOCOBERTURA = @cconceptocobertura and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    clientValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCLIENTE, XCLIENTE, BACTIVO from CLCLIENTE WHERE CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCorporativeCharges: async(searchData) => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccarga', sql.Int, searchData.ccarga ? searchData.ccarga : undefined)
                .input('itipocliente', sql.NVarChar, 'C')
                .query(`select CCARGA, XCORREDOR, XPOLIZA, XDESCRIPCION_L, FCREACION FROM VWBUSCARCARGACORPORATIVA WHERE ITIPOCLIENTE = @itipocliente${ searchData.ccarga ? " AND CCARGA = @ccarga" : '' }`)
            return {result: result};
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    searchCorporativeIssuanceCertificates: async(searchData) => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccarga', sql.Int, searchData.ccarga)
                .input('clote', sql.Int, searchData.clote)
                .query('select ID, CCARGA, CLOTE, XPOLIZA, XCERTIFICADO, XNOMBRE, XPLACA, XMARCA, XMODELO, XVERSION FROM VWBUSCARCERTIFICADOSCORPORATIVOSXCARGA WHERE CCARGA = @ccarga AND CLOTE = @clote')
            return {result: result};
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    searchCorporativeIssuanceDetail: async(searchData) => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('id', sql.Int, searchData.id)
                .query('select ID, CCARGA, CLOTE, XPOLIZA, XCERTIFICADO, FCARGA, FDESDE_POL, FHASTA_POL, XCLIENTE, XEMAILCLIENTE, XDOCIDENTIDADCLIENTE, XPROPIETARIO, XEMAILPROPIETARIO, XDOCIDENTIDADPROPIETARIO, XMARCA, XMODELO, XVERSION, CANO, XTIPO, XCLASE, XSERIALCARROCERIA, XSERIALMOTOR, XCOLOR, NCAPACIDADPASAJEROS, XPLACA, MSUMA_A_CASCO, MSUMA_OTROS, PTASA_ASEGURADORA, MPRIMA_CASCO, MPRIMA_OTROS, MPRIMA_CATASTROFICO, MGASTOS_RECUPERACION, MBASICA_RCV, MEXCESO_LIMITE, MDEFENSA_PENAL, MMUERTE, MINVALIDEZ, MGASTOS_MEDICOS, MGASTOS_FUNERARIOS, MTOTAL_PRIMA_ASEG, MDEDUCIBLE, XTIPO_DEDUCIBLE, PTASA_FONDO_ANUAL, MFONDO_ARYS, MMEMBRESIA ' 
                + ' FROM VWBUSCARDETALLECERTIFICADOSCORPORATIVOS WHERE ID = @id')
            return {result: result};
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    parentPolicyValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CPAIS', sql.Numeric(4, 0), searchData.cpais)
                .input('CCOMPANIA', sql.Int, searchData.ccompania)
                .query('SELECT CCARGA, XDESCRIPCION_L, XPOLIZA, FCREACION FROM SUPOLIZAMATRIZ WHERE CPAIS = @CPAIS AND CCOMPANIA = @CCOMPANIA');
            //sql.close();
            return { result: result };
        }catch(err){
;
            return { error: err.message };
        }
    },
    chargeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('SELECT CCARGA, XPOLIZA, XCLIENTE, FINGRESO, XPLACA FROM VWBUSCARFECHACARGAXCLIENTE WHERE CESTATUSGENERAL IS NULL');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    corporativeChargeValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('itipocliente', sql.NVarChar, 'C')
                .query('SELECT CCARGA, XPOLIZA, XCLIENTE FROM VWBUSCARCARGAXCLIENTECORPORATIVO WHERE CESTATUSGENERAL IS NULL AND ITIPOCLIENTE = @itipocliente');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    batchValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CCARGA', sql.Int, searchData.ccarga)
                .query('SELECT * FROM SUPOLIZALOTE WHERE CCARGA = @CCARGA ');
            //sql.close();
            return { result: result };
        }catch(err){
;
            return { error: err.message };
        }
    },
    receiptValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('clote', sql.Int, searchData.clote)
                .input('ccarga', sql.Int, searchData.ccarga)
                .query('select * from SURECIBO where CLOTE = @clote AND CCARGA = @ccarga ');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchExtraCoverageQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCOBERTURAEXTRADATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.casociado ? " and CASOCIADO = @casociado" : '' }${ searchData.xdescripcion ? " and XDESCRIPCION like '%" + searchData.xdescripcion + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('casociado', sql.Int, searchData.casociado ? searchData.casociado : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyExtraCoverageDescriptionToCreateQuery: async(extraCoverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                .input('ccompania', sql.Int, extraCoverageData.ccompania)
                .input('ccliente', sql.Int, extraCoverageData.ccliente)
                .input('xdescripcion', sql.NVarChar, extraCoverageData.xdescripcion)
                .query('select * from CTCOBERTURAEXTRA where XDESCRIPCION = @xdescripcion and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createExtraCoverageQuery: async(extraCoverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                .input('ccompania', sql.Int, extraCoverageData.ccompania)
                .input('ccliente', sql.Int, extraCoverageData.ccliente)
                .input('casociado', sql.Int, extraCoverageData.casociado)
                .input('ccobertura', sql.Int, extraCoverageData.ccobertura)
                .input('cconceptocobertura', sql.Int, extraCoverageData.cconceptocobertura)
                .input('xdescripcion', sql.NVarChar, extraCoverageData.xdescripcion)
                .input('fefectiva', sql.DateTime, extraCoverageData.fefectiva)
                .input('mcoberturaextra', sql.Numeric(11, 2), extraCoverageData.mcoberturaextra)
                .input('bactivo', sql.Bit, extraCoverageData.bactivo)
                .input('cusuariocreacion', sql.Int, extraCoverageData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CTCOBERTURAEXTRA (CPAIS, CCOMPANIA, CCLIENTE, CASOCIADO, CCOBERTURA, CCONCEPTOCOBERTURA, XDESCRIPCION, FEFECTIVA, MCOBERTURAEXTRA, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ccliente, @casociado, @ccobertura, @cconceptocobertura, @xdescripcion, @fefectiva, @mcoberturaextra, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                    .input('ccompania', sql.Int, extraCoverageData.ccompania)
                    .input('ccliente', sql.Int, extraCoverageData.ccliente)
                    .input('xdescripcion', sql.NVarChar, extraCoverageData.xdescripcion)
                    .query('select * from CTCOBERTURAEXTRA where CCLIENTE = @ccliente and XDESCRIPCION = @xdescripcion and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && extraCoverageData.vehicleTypes){
                    for(let i = 0; i < extraCoverageData.vehicleTypes.length; i++){
                        let insert = await pool.request()
                            .input('ccoberturaextra', sql.Int, query.recordset[0].CCOBERTURAEXTRA)
                            .input('ctipovehiculo', sql.Int, extraCoverageData.vehicleTypes[i].ctipovehiculo)
                            .input('cusuariocreacion', sql.Int, extraCoverageData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into CTTIPOVEHICULOCOBERTURAEXTRA (CCOBERTURAEXTRA, CTIPOVEHICULO, CUSUARIOCREACION, FCREACION) values (@ccoberturaextra, @ctipovehiculo, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getExtraCoverageDataQuery: async(extraCoverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                .input('ccompania', sql.Int, extraCoverageData.ccompania)
                .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                .query('select * from CTCOBERTURAEXTRA where CCOBERTURAEXTRA = @ccoberturaextra and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyExtraCoverageDescriptionToUpdateQuery: async(extraCoverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                .input('ccompania', sql.Int, extraCoverageData.ccompania)
                .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                .input('ccliente', sql.Int, extraCoverageData.ccliente)
                .input('xdescripcion', sql.NVarChar, extraCoverageData.xdescripcion)
                .query('select * from CTCOBERTURAEXTRA where XDESCRIPCION = @xdescripcion and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania and CCOBERTURAEXTRA != @ccoberturaextra');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getExtraCoverageVehicleTypesDataQuery: async(ccoberturaextra) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccoberturaextra', sql.Int, ccoberturaextra)
                .query('select * from VWBUSCARTIPOVEHICULOXCOBERTURAEXTRADATA where CCOBERTURAEXTRA = @ccoberturaextra');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateExtraCoverageQuery: async(extraCoverageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), extraCoverageData.cpais)
                .input('ccompania', sql.Int, extraCoverageData.ccompania)
                .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                .input('ccliente', sql.Int, extraCoverageData.ccliente)
                .input('casociado', sql.Int, extraCoverageData.casociado)
                .input('ccobertura', sql.Int, extraCoverageData.ccobertura)
                .input('cconceptocobertura', sql.Int, extraCoverageData.cconceptocobertura)
                .input('xdescripcion', sql.NVarChar, extraCoverageData.xdescripcion)
                .input('fefectiva', sql.DateTime, extraCoverageData.fefectiva)
                .input('mcoberturaextra', sql.Numeric(11, 2), extraCoverageData.mcoberturaextra)
                .input('bactivo', sql.Bit, extraCoverageData.bactivo)
                .input('cusuariomodificacion', sql.Int, extraCoverageData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CTCOBERTURAEXTRA set CCLIENTE = @ccliente, CASOCIADO = @casociado, CCOBERTURA = @ccobertura, CCONCEPTOCOBERTURA = @cconceptocobertura, XDESCRIPCION = @xdescripcion, FEFECTIVA = @fefectiva, MCOBERTURAEXTRA = @mcoberturaextra, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOBERTURAEXTRA = @ccoberturaextra and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createVehicleTypesByExtraCoverageUpdateQuery: async(vehicleTypes, extraCoverageData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let insert = await pool.request()
                    .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('cusuariocreacion', sql.Int, extraCoverageData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CTTIPOVEHICULOCOBERTURAEXTRA (CCOBERTURAEXTRA, CTIPOVEHICULO, CUSUARIOCREACION, FCREACION) values (@ccoberturaextra, @ctipovehiculo, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateVehicleTypesByExtraCoverageUpdateQuery: async(vehicleTypes, extraCoverageData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let update = await pool.request()
                    .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('cusuariomodificacion', sql.Int, extraCoverageData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CTTIPOVEHICULOCOBERTURAEXTRA set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOVEHICULO = @ctipovehiculo and CCOBERTURAEXTRA = @ccoberturaextra');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteVehicleTypesByExtraCoverageUpdateQuery: async(vehicleTypes, extraCoverageData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let erase = await pool.request()
                    .input('ccoberturaextra', sql.Int, extraCoverageData.ccoberturaextra)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .query('delete from CTTIPOVEHICULOCOBERTURAEXTRA where CTIPOVEHICULO = @ctipovehiculo and CCOBERTURAEXTRA = @ccoberturaextra');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    coverageValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCOBERTURA, XCOBERTURA, BACTIVO from MACOBERTURA where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    coverageConceptValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCONCEPTOCOBERTURA, XCONCEPTOCOBERTURA, BACTIVO from MACONCEPTOCOBERTURA where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchRoadManagementConfigurationQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCONFIGURACIONGESTIONVIALDATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.casociado ? " and CASOCIADO = @casociado" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('casociado', sql.Int, searchData.casociado ? searchData.casociado : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRoadManagementConfigurationAssociateToCreateQuery: async(roadManagementConfigurationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                .input('ccliente', sql.Int, roadManagementConfigurationData.ccliente)
                .input('casociado', sql.Int, roadManagementConfigurationData.casociado)
                .query('select * from CTCONFIGURACIONGESTIONVIAL where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createRoadManagementConfigurationQuery: async(roadManagementConfigurationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                .input('ccliente', sql.Int, roadManagementConfigurationData.ccliente)
                .input('casociado', sql.Int, roadManagementConfigurationData.casociado)
                .input('bactivo', sql.Bit, roadManagementConfigurationData.bactivo)
                .input('cusuariocreacion', sql.Int, roadManagementConfigurationData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CTCONFIGURACIONGESTIONVIAL (CPAIS, CCOMPANIA, CCLIENTE, CASOCIADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ccliente, @casociado, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                    .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                    .input('ccliente', sql.Int, roadManagementConfigurationData.ccliente)
                    .input('casociado', sql.Int, roadManagementConfigurationData.casociado)
                    .query('select * from CTCONFIGURACIONGESTIONVIAL where CCLIENTE = @ccliente and CASOCIADO = @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && roadManagementConfigurationData.vehicleTypes){
                    for(let i = 0; i < roadManagementConfigurationData.vehicleTypes.length; i++){
                        let insert = await pool.request()
                            .input('cconfiguraciongestionvial', sql.Int, query.recordset[0].CCONFIGURACIONGESTIONVIAL)
                            .input('ctipovehiculo', sql.Int, roadManagementConfigurationData.vehicleTypes[i].ctipovehiculo)
                            .input('fefectiva', sql.DateTime, roadManagementConfigurationData.vehicleTypes[i].fefectiva)
                            .input('mtipovehiculoconfiguraciongestionvial', sql.Numeric(11, 2), roadManagementConfigurationData.vehicleTypes[i].mtipovehiculoconfiguraciongestionvial)
                            .input('nlimiteano', sql.Numeric(4, 0), roadManagementConfigurationData.vehicleTypes[i].nlimiteano)
                            .input('mmayorlimiteano', sql.Numeric(11, 2), roadManagementConfigurationData.vehicleTypes[i].mmayorlimiteano)
                            .input('cusuariocreacion', sql.Int, roadManagementConfigurationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into CTTIPOVEHICULOCONFIGURACIONGESTIONVIAL (CCONFIGURACIONGESTIONVIAL, CTIPOVEHICULO, FEFECTIVA, MTIPOVEHICULOCONFIGURACIONGESTIONVIAL, NLIMITEANO, MMAYORLIMITEANO, CUSUARIOCREACION, FCREACION) values (@cconfiguraciongestionvial, @ctipovehiculo, @fefectiva, @mtipovehiculoconfiguraciongestionvial, @nlimiteano, @mmayorlimiteano, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getRoadManagementConfigurationDataQuery: async(roadManagementConfigurationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                .query('select * from CTCONFIGURACIONGESTIONVIAL where CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getRoadManagementConfigurationVehicleTypesDataQuery: async(cconfiguraciongestionvial) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cconfiguraciongestionvial', sql.Int, cconfiguraciongestionvial)
                .query('select * from VWBUSCARTIPOVEHICULOXCONFIGURACIONGESTIONVIALDATA where CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyRoadManagementConfigurationAssociateToUpdateQuery: async(roadManagementConfigurationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                .input('ccliente', sql.Int, roadManagementConfigurationData.ccliente)
                .input('casociado', sql.Int, roadManagementConfigurationData.casociado)
                .query('select * from CTCONFIGURACIONGESTIONVIAL where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania and CCONFIGURACIONGESTIONVIAL != @cconfiguraciongestionvial');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateRoadManagementConfigurationQuery: async(roadManagementConfigurationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), roadManagementConfigurationData.cpais)
                .input('ccompania', sql.Int, roadManagementConfigurationData.ccompania)
                .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                .input('ccliente', sql.Int, roadManagementConfigurationData.ccliente)
                .input('casociado', sql.Int, roadManagementConfigurationData.casociado)
                .input('bactivo', sql.Bit, roadManagementConfigurationData.bactivo)
                .input('cusuariomodificacion', sql.Int, roadManagementConfigurationData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CTCONFIGURACIONGESTIONVIAL set CCLIENTE = @ccliente, CASOCIADO = @casociado, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createVehicleTypesByRoadManagementConfigurationUpdateQuery: async(vehicleTypes, roadManagementConfigurationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let insert = await pool.request()
                    .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('fefectiva', sql.DateTime, vehicleTypes[i].fefectiva)
                    .input('mtipovehiculoconfiguraciongestionvial', sql.Numeric(11, 2), vehicleTypes[i].mtipovehiculoconfiguraciongestionvial)
                    .input('nlimiteano', sql.Numeric(4, 0), vehicleTypes[i].nlimiteano)
                    .input('mmayorlimiteano', sql.Numeric(11, 2), vehicleTypes[i].mmayorlimiteano)
                    .input('cusuariocreacion', sql.Int, roadManagementConfigurationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CTTIPOVEHICULOCONFIGURACIONGESTIONVIAL (CCONFIGURACIONGESTIONVIAL, CTIPOVEHICULO, FEFECTIVA, MTIPOVEHICULOCONFIGURACIONGESTIONVIAL, NLIMITEANO, MMAYORLIMITEANO, CUSUARIOCREACION, FCREACION) values (@cconfiguraciongestionvial, @ctipovehiculo, @fefectiva, @mtipovehiculoconfiguraciongestionvial, @nlimiteano, @mmayorlimiteano, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateVehicleTypesByRoadManagementConfigurationUpdateQuery: async(vehicleTypes, roadManagementConfigurationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let update = await pool.request()
                    .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('fefectiva', sql.DateTime, vehicleTypes[i].fefectiva)
                    .input('mtipovehiculoconfiguraciongestionvial', sql.Numeric(11, 2), vehicleTypes[i].mtipovehiculoconfiguraciongestionvial)
                    .input('nlimiteano', sql.Numeric(4, 0), vehicleTypes[i].nlimiteano)
                    .input('mmayorlimiteano', sql.Numeric(11, 2), vehicleTypes[i].mmayorlimiteano)
                    .input('cusuariomodificacion', sql.Int, roadManagementConfigurationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CTTIPOVEHICULOCONFIGURACIONGESTIONVIAL set FEFECTIVA = @fefectiva, MTIPOVEHICULOCONFIGURACIONGESTIONVIAL = @mtipovehiculoconfiguraciongestionvial, NLIMITEANO = @nlimiteano, MMAYORLIMITEANO = @mmayorlimiteano, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOVEHICULO = @ctipovehiculo and CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteVehicleTypesByRoadManagementConfigurationUpdateQuery: async(vehicleTypes, roadManagementConfigurationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let erase = await pool.request()
                    .input('cconfiguraciongestionvial', sql.Int, roadManagementConfigurationData.cconfiguraciongestionvial)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .query('delete from CTTIPOVEHICULOCONFIGURACIONGESTIONVIAL where CTIPOVEHICULO = @ctipovehiculo and CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchFeesRegisterQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARREGISTROTASADATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.casociado ? " and CASOCIADO = @casociado" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('casociado', sql.Int, searchData.casociado ? searchData.casociado : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyFeesRegisterAssociateToCreateQuery: async(feesRegisterData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                .input('ccompania', sql.Int, feesRegisterData.ccompania)
                .input('ccliente', sql.Int, feesRegisterData.ccliente)
                .input('casociado', sql.Int, feesRegisterData.casociado)
                .query('select * from CTREGISTROTASA where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createFeesRegisterQuery: async(feesRegisterData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                .input('ccompania', sql.Int, feesRegisterData.ccompania)
                .input('ccliente', sql.Int, feesRegisterData.ccliente)
                .input('casociado', sql.Int, feesRegisterData.casociado)
                .input('bactivo', sql.Bit, feesRegisterData.bactivo)
                .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CTREGISTROTASA (CPAIS, CCOMPANIA, CCLIENTE, CASOCIADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ccliente, @casociado, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                    .input('ccompania', sql.Int, feesRegisterData.ccompania)
                    .input('ccliente', sql.Int, feesRegisterData.ccliente)
                    .input('casociado', sql.Int, feesRegisterData.casociado)
                    .query('select * from CTREGISTROTASA where CCLIENTE = @ccliente and CASOCIADO = @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && feesRegisterData.vehicleTypes){
                    for(let i = 0; i < feesRegisterData.vehicleTypes.length; i++){
                        let insert = await pool.request()
                            .input('cregistrotasa', sql.Int, query.recordset[0].CREGISTROTASA)
                            .input('ctipovehiculo', sql.Int, feesRegisterData.vehicleTypes[i].ctipovehiculo)
                            .input('miniciointervalo', sql.Numeric(11, 2), feesRegisterData.vehicleTypes[i].miniciointervalo)
                            .input('mfinalintervalo', sql.Numeric(11, 2), feesRegisterData.vehicleTypes[i].mfinalintervalo)
                            .input('ptasa', sql.Numeric(5,2), feesRegisterData.vehicleTypes[i].ptasa)
                            .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into CTTIPOVEHICULOREGISTROTASA (CREGISTROTASA, CTIPOVEHICULO, MINICIOINTERVALO, MFINALINTERVALO, PTASA, CUSUARIOCREACION, FCREACION) output inserted.CTIPOVEHICULOREGISTROTASA values (@cregistrotasa, @ctipovehiculo, @miniciointervalo, @mfinalintervalo, @ptasa, @cusuariocreacion, @fcreacion)')
                        if(feesRegisterData.vehicleTypes[i].intervals){
                            for(let j = 0; j < feesRegisterData.vehicleTypes[i].intervals.length; j++){
                                let subInsert = await pool.request()
                                    .input('ctipovehiculoregistrotasa', sql.Int, insert.recordset[0].CTIPOVEHICULOREGISTROTASA)
                                    .input('fanoinicio', sql.Numeric(4, 0), feesRegisterData.vehicleTypes[i].intervals[j].fanoinicio)
                                    .input('fanofinal', sql.Numeric(4, 0), feesRegisterData.vehicleTypes[i].intervals[j].fanofinal)
                                    .input('ptasainterna', sql.Numeric(5, 2), feesRegisterData.vehicleTypes[i].intervals[j].ptasainterna)
                                    .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariocreacion)
                                    .input('fcreacion', sql.DateTime, new Date())
                                    .query('insert into CTRANGOANOTIPOVEHICULO (CTIPOVEHICULOREGISTROTASA, FANOINICIO, FANOFINAL, PTASAINTERNA, CUSUARIOCREACION, FCREACION) values (@ctipovehiculoregistrotasa, @fanoinicio, @fanofinal, @ptasainterna, @cusuariocreacion, @fcreacion)')
                            }
                        }
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getFeesRegisterDataQuery: async(feesRegisterData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                .input('ccompania', sql.Int, feesRegisterData.ccompania)
                .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                .query('select * from CTREGISTROTASA where CREGISTROTASA = @cregistrotasa and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFeesRegisterVehicleTypesDataQuery: async(cregistrotasa) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cregistrotasa', sql.Int, cregistrotasa)
                .query('select * from VWBUSCARTIPOVEHICULOXREGISTROTASADATA where CREGISTROTASA = @cregistrotasa');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getYearRangesVehicleTypeDataQuery: async(ctipovehiculoregistrotasa) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ctipovehiculoregistrotasa', sql.Int, ctipovehiculoregistrotasa)
                .query('select * from CTRANGOANOTIPOVEHICULO where CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyFeesRegisterAssociateToUpdateQuery: async(feesRegisterData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                .input('ccompania', sql.Int, feesRegisterData.ccompania)
                .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                .input('ccliente', sql.Int, feesRegisterData.ccliente)
                .input('casociado', sql.Int, feesRegisterData.casociado)
                .query('select * from CTREGISTROTASA where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania and CREGISTROTASA != @cregistrotasa');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateFeesRegisterQuery: async(feesRegisterData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), feesRegisterData.cpais)
                .input('ccompania', sql.Int, feesRegisterData.ccompania)
                .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                .input('ccliente', sql.Int, feesRegisterData.ccliente)
                .input('casociado', sql.Int, feesRegisterData.casociado)
                .input('bactivo', sql.Bit, feesRegisterData.bactivo)
                .input('cusuariomodificacion', sql.Int, feesRegisterData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CTREGISTROTASA set CCLIENTE = @ccliente, CASOCIADO = @casociado, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CREGISTROTASA = @cregistrotasa and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createVehicleTypesByFeesRegisterUpdateQuery: async(vehicleTypes, feesRegisterData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let insert = await pool.request()
                    .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('miniciointervalo', sql.Numeric(11, 2), vehicleTypes[i].miniciointervalo)
                    .input('mfinalintervalo', sql.Numeric(11, 2), vehicleTypes[i].mfinalintervalo)
                    .input('ptasa', sql.Numeric(5, 2), vehicleTypes[i].ptasa)
                    .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CTTIPOVEHICULOREGISTROTASA (CREGISTROTASA, CTIPOVEHICULO, MINICIOINTERVALO, MFINALINTERVALO, PTASA, CUSUARIOCREACION, FCREACION) output inserted.CTIPOVEHICULOREGISTROTASA values (@cregistrotasa, @ctipovehiculo, @miniciointervalo, @mfinalintervalo, @ptasa, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
                if(insert.rowsAffected > 0 && vehicleTypes[i].intervals){
                    for(let j = 0; j < vehicleTypes[i].intervals.length; j++){
                        let subInsert = await pool.request()
                            .input('ctipovehiculoregistrotasa', sql.Int, insert.recordset[0].CTIPOVEHICULOREGISTROTASA)
                            .input('fanoinicio', sql.Numeric(4, 0), vehicleTypes[i].intervals[j].fanoinicio)
                            .input('fanofinal', sql.Numeric(4, 0), vehicleTypes[i].intervals[j].fanofinal)
                            .input('ptasainterna', sql.Numeric(5, 2), vehicleTypes[i].intervals[j].ptasainterna)
                            .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariomodificacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into CTRANGOANOTIPOVEHICULO (CTIPOVEHICULOREGISTROTASA, FANOINICIO, FANOFINAL, PTASAINTERNA, CUSUARIOCREACION, FCREACION) values (@ctipovehiculoregistrotasa, @fanoinicio, @fanofinal, @ptasainterna, @cusuariocreacion, @fcreacion)')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateVehicleTypesByFeesRegisterUpdateQuery: async(vehicleTypes, feesRegisterData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let update = await pool.request()
                    .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                    .input('miniciointervalo', sql.Numeric(11, 2), vehicleTypes[i].miniciointervalo)
                    .input('mfinalintervalo', sql.Numeric(11, 2), vehicleTypes[i].mfinalintervalo)
                    .input('ptasa', sql.Numeric(5, 2), vehicleTypes[i].ptasa)
                    .input('cusuariomodificacion', sql.Int, feesRegisterData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CTTIPOVEHICULOREGISTROTASA set MINICIOINTERVALO = @miniciointervalo, MFINALINTERVALO = @mfinalintervalo, PTASA = @ptasa, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOVEHICULO = @ctipovehiculo and CREGISTROTASA = @cregistrotasa and CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa');
                rowsAffected = rowsAffected + update.rowsAffected;
                if(vehicleTypes[i].intervalsResult){
                    if(update.rowsAffected > 0 && vehicleTypes[i].intervalsResult.create){
                        for(let j = 0; j < vehicleTypes[i].intervalsResult.create.length; j++){
                            let subInsert = await pool.request()
                                .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                                .input('fanoinicio', sql.Numeric(4, 0), vehicleTypes[i].intervalsResult.create[j].fanoinicio)
                                .input('fanofinal', sql.Numeric(4, 0), vehicleTypes[i].intervalsResult.create[j].fanofinal)
                                .input('ptasainterna', sql.Numeric(5, 2), vehicleTypes[i].intervalsResult.create[j].ptasainterna)
                                .input('cusuariocreacion', sql.Int, feesRegisterData.cusuariomodificacion)
                                .input('fcreacion', sql.DateTime, new Date())
                                .query('insert into CTRANGOANOTIPOVEHICULO (CTIPOVEHICULOREGISTROTASA, FANOINICIO, FANOFINAL, PTASAINTERNA, CUSUARIOCREACION, FCREACION) values (@ctipovehiculoregistrotasa, @fanoinicio, @fanofinal, @ptasainterna, @cusuariocreacion, @fcreacion)')
                        }
                    }
                    if(update.rowsAffected > 0 && vehicleTypes[i].intervalsResult.update){
                        for(let j = 0; j < vehicleTypes[i].intervalsResult.update.length; j++){
                            let subUpdate = await pool.request()
                                .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                                .input('crangoanotipovehiculo', sql.Int, vehicleTypes[i].intervalsResult.update[j].crangoanotipovehiculo)
                                .input('fanoinicio', sql.Numeric(4, 0), vehicleTypes[i].intervalsResult.update[j].fanoinicio)
                                .input('fanofinal', sql.Numeric(4, 0), vehicleTypes[i].intervalsResult.update[j].fanofinal)
                                .input('ptasainterna', sql.Numeric(5, 2), vehicleTypes[i].intervalsResult.update[j].ptasainterna)
                                .input('cusuariomodificacion', sql.Int, feesRegisterData.cusuariomodificacion)
                                .input('fmodificacion', sql.DateTime, new Date())
                                .query('update CTRANGOANOTIPOVEHICULO set FANOINICIO = @fanoinicio, FANOFINAL = @fanofinal, PTASAINTERNA = @ptasainterna, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa and CRANGOANOTIPOVEHICULO = @crangoanotipovehiculo')
                        }
                    }
                    if(update.rowsAffected > 0 && vehicleTypes[i].intervalsResult.delete){
                        for(let j = 0; j < vehicleTypes[i].intervalsResult.delete.length; j++){
                            let subDelete = await pool.request()
                                .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                                .input('crangoanotipovehiculo', sql.Int, vehicleTypes[i].intervalsResult.delete[j].crangoanotipovehiculo)
                                .query('delete from CTRANGOANOTIPOVEHICULO where CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa and CRANGOANOTIPOVEHICULO = @crangoanotipovehiculo')
                        }
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteVehicleTypesByFeesRegisterUpdateQuery: async(vehicleTypes, feesRegisterData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypes.length; i++){
                let suberase = await pool.request()
                    .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                    .query('delete from CTRANGOANOTIPOVEHICULO where CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa');
                let erase = await pool.request()
                    .input('cregistrotasa', sql.Int, feesRegisterData.cregistrotasa)
                    .input('ctipovehiculo', sql.Int, vehicleTypes[i].ctipovehiculo)
                    .input('ctipovehiculoregistrotasa', sql.Int, vehicleTypes[i].ctipovehiculoregistrotasa)
                    .query('delete from CTTIPOVEHICULOREGISTROTASA where CTIPOVEHICULO = @ctipovehiculo and CREGISTROTASA = @cregistrotasa and CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchQuoteByFleetQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCOTIZADORFLOTADATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.casociado ? " and CASOCIADO = @casociado" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('casociado', sql.Int, searchData.casociado ? searchData.casociado : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyQuoteByFleetAssociateToCreateQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                .input('ccliente', sql.Int, quoteByFleetData.ccliente)
                .input('casociado', sql.Int, quoteByFleetData.casociado)
                .query('select * from CTCOTIZADORFLOTA where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createQuoteByFleetQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                .input('ccliente', sql.Int, quoteByFleetData.ccliente)
                .input('casociado', sql.Int, quoteByFleetData.casociado)
                .input('mmembresia', sql.Numeric(11, 2), quoteByFleetData.mmembresia)
                .input('baprobado', sql.Bit, false)
                .input('bactivo', sql.Bit, quoteByFleetData.bactivo)
                .input('cusuariocreacion', sql.Int, quoteByFleetData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CTCOTIZADORFLOTA (CPAIS, CCOMPANIA, CCLIENTE, CASOCIADO, MMEMBRESIA, BAPROBADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ccliente, @casociado, @mmembresia, @baprobado, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                    .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                    .input('ccliente', sql.Int, quoteByFleetData.ccliente)
                    .input('casociado', sql.Int, quoteByFleetData.casociado)
                    .query('select * from CTCOTIZADORFLOTA where CCLIENTE = @ccliente and CASOCIADO = @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && quoteByFleetData.extraCoverages){
                    for(let i = 0; i < quoteByFleetData.extraCoverages.length; i++){
                        let insert = await pool.request()
                            .input('ccotizadorflota', sql.Int, query.recordset[0].CCOTIZADORFLOTA)
                            .input('ccoberturaextra', sql.Int, quoteByFleetData.extraCoverages[i].ccoberturaextra)
                            .input('cusuariocreacion', sql.Int, quoteByFleetData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into CTCOBERTURAEXTRACOTIZADORFLOTA (CCOTIZADORFLOTA, CCOBERTURAEXTRA, CUSUARIOCREACION, FCREACION) values (@ccotizadorflota, @ccoberturaextra, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getQuoteByFleetDataQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                .query('select * from CTCOTIZADORFLOTA where CCOTIZADORFLOTA = @ccotizadorflota and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getQuoteByFleetExtraCoveragesDataQuery: async(ccotizadorflota) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccotizadorflota', sql.Int, ccotizadorflota)
                .query('select * from VWBUSCARCOBERTURAEXTRAXCOTIZADORFLOTADATA where CCOTIZADORFLOTA = @ccotizadorflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyQuoteByFleetAssociateToUpdateQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                .input('ccliente', sql.Int, quoteByFleetData.ccliente)
                .input('casociado', sql.Int, quoteByFleetData.casociado)
                .query('select * from CTCOTIZADORFLOTA where CASOCIADO = @casociado and CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania and CCOTIZADORFLOTA != @ccotizadorflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateQuoteByFleetQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), quoteByFleetData.cpais)
                .input('ccompania', sql.Int, quoteByFleetData.ccompania)
                .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                .input('ccliente', sql.Int, quoteByFleetData.ccliente)
                .input('casociado', sql.Int, quoteByFleetData.casociado)
                .input('mmembresia', sql.Numeric(11, 2), quoteByFleetData.mmembresia)
                .input('bactivo', sql.Bit, quoteByFleetData.bactivo)
                .input('cusuariomodificacion', sql.Int, quoteByFleetData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CTCOTIZADORFLOTA set CCLIENTE = @ccliente, CASOCIADO = @casociado, MMEMBRESIA = @mmembresia, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOTIZADORFLOTA = @ccotizadorflota and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createExtraCoverageByQuoteByFleetUpdateQuery: async(extraCoverages, quoteByFleetData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < extraCoverages.length; i++){
                let insert = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('ccoberturaextra', sql.Int, extraCoverages[i].ccoberturaextra)
                    .input('cusuariocreacion', sql.Int, quoteByFleetData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CTCOBERTURAEXTRACOTIZADORFLOTA (CCOTIZADORFLOTA, CCOBERTURAEXTRA, CUSUARIOCREACION, FCREACION) values (@ccotizadorflota, @ccoberturaextra, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateExtraCoverageByQuoteByFleetUpdateQuery: async(extraCoverages, quoteByFleetData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < extraCoverages.length; i++){
                let update = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('ccoberturaextra', sql.Int, extraCoverages[i].ccoberturaextra)
                    .input('cusuariomodificacion', sql.Int, quoteByFleetData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CTCOBERTURAEXTRACOTIZADORFLOTA set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCOBERTURAEXTRA = @ccoberturaextra and CCOTIZADORFLOTA = @ccotizadorflota');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteExtraCoverageByQuoteByFleetUpdateQuery: async(extraCoverages, quoteByFleetData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < extraCoverages.length; i++){
                let erase = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('ccoberturaextra', sql.Int, extraCoverages[i].ccoberturaextra)
                    .query('delete from CTCOBERTURAEXTRACOTIZADORFLOTA where CCOBERTURAEXTRA = @ccoberturaextra and CCOTIZADORFLOTA = @ccotizadorflota');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getClientExtraCoveragesValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ccliente', sql.Int, searchData.ccliente)
                .input('casociado', sql.Int, searchData.casociado)
                .query('select * from CTCOBERTURAEXTRA where CCLIENTE = @ccliente and CASOCIADO = @casociado and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    colorValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CCOLOR, XCOLOR, BACTIVO from MACOLOR where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    coinValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select cmoneda, xmoneda from MAMONEDAS');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    utilityValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CUSO, XUSO from MAUSOVEHICULO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    modelTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CTIPOMODELO, XTIPOMODELO from MATIPOMODELOVEHICULO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    receiptTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .query('select CTIPORECIBO, XTIPORECIBO, NCANTIDADDIAS from MATIPORECIBO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    versionValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('cmarca', sql.NVarChar, searchData.cmarca)
                .input('cmodelo', sql.NVarChar, searchData.cmodelo)
                .query('select DISTINCT CVERSION, XVERSION, CANO, NPASAJERO, BACTIVO , XTRANSMISION  from VWBUSCARMARCAMODELOVERSION where CPAIS = @cpais AND CMARCA = @cmarca AND CMODELO = @cmodelo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getQuoteByFleetApprovalDataQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                .query('select * from CTAPROBACIONCOTIZADORFLOTA where CCOTIZADORFLOTA = @ccotizadorflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateApprovalQuoteByFleetQuery: async(quoteByFleetData) => {
        try{
            let pool = await sql.connect(config);
            let query = await pool.request()
                .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                .query('select * from CTAPROBACIONCOTIZADORFLOTA where CCOTIZADORFLOTA = @ccotizadorflota');
            if(query.rowsAffected > 0){
                let update = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('mperdidaparcial', sql.Numeric(11, 2), quoteByFleetData.mperdidaparcial)
                    .input('cimpuestoevento', sql.Int, quoteByFleetData.cimpuestoevento)
                    .input('mhonorario', sql.Numeric(11, 2), quoteByFleetData.mhonorario)
                    .input('cimpuestoprofesional', sql.Int, quoteByFleetData.cimpuestoprofesional)
                    .input('mgestionvial', sql.Numeric(11, 2), quoteByFleetData.mgestionvial)
                    .input('cimpuestogestion', sql.Int, quoteByFleetData.cimpuestogestion)
                    .input('mtotalcreditofiscal', sql.Numeric(11, 2), quoteByFleetData.mtotalcreditofiscal)
                    .input('mtotalcapital', sql.Numeric(11, 2), quoteByFleetData.mtotalcapital)
                    .input('cusuariomodificacion', sql.Int, quoteByFleetData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CTAPROBACIONCOTIZADORFLOTA set MPERDIDAPARCIAL = @mperdidaparcial, CIMPUESTOEVENTO = @cimpuestoevento, MHONORARIO = @mhonorario, CIMPUESTOPROFESIONAL = @cimpuestoprofesional, MGESTIONVIAL = @mgestionvial, CIMPUESTOGESTION = @cimpuestogestion, MTOTALCREDITOFISCAL = @mtotalcreditofiscal, MTOTALCAPITAL = @mtotalcapital, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion where CCOTIZADORFLOTA = @ccotizadorflota');
                //sql.close();
                return { result: update };
            }else{
                let update = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('baprobado', sql.Bit, true)
                    .query('update CTCOTIZADORFLOTA set BAPROBADO = @baprobado where CCOTIZADORFLOTA = @ccotizadorflota');
                let insert = await pool.request()
                    .input('ccotizadorflota', sql.Int, quoteByFleetData.ccotizadorflota)
                    .input('mperdidaparcial', sql.Numeric(11, 2), quoteByFleetData.mperdidaparcial)
                    .input('cimpuestoevento', sql.Int, quoteByFleetData.cimpuestoevento)
                    .input('mhonorario', sql.Numeric(11, 2), quoteByFleetData.mhonorario)
                    .input('cimpuestoprofesional', sql.Int, quoteByFleetData.cimpuestoprofesional)
                    .input('mgestionvial', sql.Numeric(11, 2), quoteByFleetData.mgestionvial)
                    .input('cimpuestogestion', sql.Int, quoteByFleetData.cimpuestogestion)
                    .input('mtotalcreditofiscal', sql.Numeric(11, 2), quoteByFleetData.mtotalcreditofiscal)
                    .input('mtotalcapital', sql.Numeric(11, 2), quoteByFleetData.mtotalcapital)
                    .input('cusuariocreacion', sql.Int, quoteByFleetData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CTAPROBACIONCOTIZADORFLOTA (CCOTIZADORFLOTA, MPERDIDAPARCIAL, CIMPUESTOEVENTO, MHONORARIO, CIMPUESTOPROFESIONAL, MGESTIONVIAL, CIMPUESTOGESTION, MTOTALCREDITOFISCAL, MTOTALCAPITAL, FCREACION, CUSUARIOCREACION) values (@ccotizadorflota, @mperdidaparcial, @cimpuestoevento, @mhonorario, @cimpuestoprofesional, @mgestionvial, @cimpuestogestion, @mtotalcreditofiscal, @mtotalcapital, @fcreacion, @cusuariocreacion)');
                //sql.close();
                return { result: insert };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    taxValrepQuery: async(cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .query('select CIMPUESTO, XIMPUESTO, BACTIVO from MAIMPUESTO where CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchOwnerQuery: async(searchData) => {
        try{
            let query = `select * from TRPROPIETARIO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xnombre ? " and XNOMBRE like '%" + searchData.xnombre + "%'" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xapellido ? " and XAPELLIDO like '%" + searchData.xapellido + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xnombre', sql.NVarChar, searchData.xnombre ? searchData.xnombre : 1)
                .input('xapellido', sql.NVarChar, searchData.xapellido ? searchData.xapellido : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyOwnerIdentificationToCreateQuery: async(ownerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                .input('ccompania', sql.Int, ownerData.ccompania)
                .input('ctipodocidentidad', sql.Int, ownerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, ownerData.xdocidentidad)
                .query('select * from TRPROPIETARIO where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createOwnerQuery: async(ownerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                .input('ccompania', sql.Int, ownerData.ccompania)
                .input('xnombre', sql.NVarChar, ownerData.xnombre)
                .input('xapellido', sql.NVarChar, ownerData.xapellido)
                .input('cestadocivil', sql.Int, ownerData.cestadocivil)
                .input('fnacimiento', sql.DateTime, ownerData.fnacimiento)
                .input('xprofesion', sql.NVarChar, ownerData.xprofesion ? ownerData.xprofesion : null)
                .input('xocupacion', sql.NVarChar, ownerData.xocupacion ? ownerData.xocupacion : null)
                .input('ctipodocidentidad', sql.Int, ownerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, ownerData.xdocidentidad)
                .input('cestado', sql.Int, ownerData.cestado)
                .input('cciudad', sql.Int, ownerData.cciudad)
                .input('xdireccion', sql.NVarChar, ownerData.xdireccion)
                .input('xemail', sql.NVarChar, ownerData.xemail)
                .input('xtelefonocasa', sql.NVarChar, ownerData.xtelefonocasa ? ownerData.xtelefonocasa : null)
                .input('xtelefonocelular', sql.NVarChar, ownerData.xtelefonocelular)
                .input('xfax', sql.NVarChar, ownerData.xfax ? ownerData.xfax : null)
                .input('cparentesco', sql.Int, ownerData.cparentesco)
                .input('bactivo', sql.Bit, ownerData.bactivo)
                .input('cusuariocreacion', sql.Int, ownerData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TRPROPIETARIO (CPAIS, CCOMPANIA, XNOMBRE, XAPELLIDO, CESTADOCIVIL, FNACIMIENTO, XPROFESION, XOCUPACION, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, CESTADO, CCIUDAD, XDIRECCION, XEMAIL, XTELEFONOCASA, XTELEFONOCELULAR, XFAX, CPARENTESCO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @xnombre, @xapellido, @cestadocivil, @fnacimiento, @xprofesion, @xocupacion, @ctipodocidentidad, @xdocidentidad, @cestado, @cciudad, @xdireccion, @xemail, @xtelefonocasa, @xtelefonocelular, @xfax, @cparentesco, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                    .input('ccompania', sql.Int, ownerData.ccompania)
                    .input('ctipodocidentidad', sql.Int, ownerData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, ownerData.xdocidentidad)
                    .query('select * from TRPROPIETARIO where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && ownerData.documents){
                    for(let i = 0; i < ownerData.documents.length; i++){
                        let insert = await pool.request()
                            .input('cpropietario', sql.Int, query.recordset[0].CPROPIETARIO)
                            .input('cdocumento', sql.Int, ownerData.documents[i].cdocumento)
                            .input('xrutaarchivo', sql.NVarChar, ownerData.documents[i].xrutaarchivo)
                            .input('cusuariocreacion', sql.Int, ownerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into TRDOCUMENTOPROPIETARIO (CPROPIETARIO, CDOCUMENTO, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@cpropietario, @cdocumento, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(query.rowsAffected > 0 && ownerData.vehicles){
                    for(let i = 0; i < ownerData.vehicles.length; i++){
                        let insert = await pool.request()
                            .input('cpropietario', sql.Int, query.recordset[0].CPROPIETARIO)
                            .input('cmarca', sql.Int, ownerData.vehicles[i].cmarca)
                            .input('cmodelo', sql.Int, ownerData.vehicles[i].cmodelo)
                            .input('cversion', sql.Int, ownerData.vehicles[i].cversion)
                            .input('xplaca', sql.NVarChar, ownerData.vehicles[i].xplaca)
                            .input('fano', sql.Numeric(4, 0), ownerData.vehicles[i].fano)
                            .input('ccolor', sql.Int, ownerData.vehicles[i].ccolor)
                            .input('nkilometraje', sql.Numeric(11, 2), ownerData.vehicles[i].nkilometraje)
                            .input('bimportado', sql.Bit, ownerData.vehicles[i].bimportado)
                            .input('xcertificadoorigen', sql.NVarChar, ownerData.vehicles[i].xcertificadoorigen)
                            .input('mpreciovehiculo', sql.Numeric(11, 2), ownerData.vehicles[i].mpreciovehiculo)
                            .input('xserialcarroceria', sql.NVarChar, ownerData.vehicles[i].xserialcarroceria)
                            .input('xserialmotor', sql.NVarChar, ownerData.vehicles[i].xserialmotor)
                            .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                            .input('cusuariocreacion', sql.Int, ownerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into TRVEHICULOPROPIETARIO (CPROPIETARIO, CMARCA, CMODELO, CVERSION, XPLACA, FANO, CCOLOR, NKILOMETRAJE, BIMPORTADO, XCERTIFICADOORIGEN, MPRECIOVEHICULO, XSERIALCARROCERIA, XSERIALMOTOR, CPAIS, CUSUARIOCREACION, FCREACION) values (@cpropietario, @cmarca, @cmodelo, @cversion, @xplaca, @fano, @ccolor, @nkilometraje, @bimportado, @xcertificadoorigen, @mpreciovehiculo, @xserialcarroceria, @xserialmotor, @cpais, @cusuariocreacion, @fcreacion)');
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getOwnerDataQuery: async(ownerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                .input('ccompania', sql.Int, ownerData.ccompania)
                .input('cpropietario', sql.Int, ownerData.cpropietario)
                .query('select * from TRPROPIETARIO where CPROPIETARIO = @cpropietario and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getOwnerDocumentsDataQuery: async(cpropietario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpropietario', sql.Int, cpropietario)
                .query('select * from VWBUSCARDOCUMENTOXPROPIETARIODATA where CPROPIETARIO = @cpropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyOwnerIdentificationToUpdateQuery: async(ownerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                .input('ccompania', sql.Int, ownerData.ccompania)
                .input('cpropietario', sql.Int, ownerData.cpropietario)
                .input('ctipodocidentidad', sql.Int, ownerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, ownerData.xdocidentidad)
                .query('select * from TRPROPIETARIO where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CPROPIETARIO != @cpropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateOwnerQuery: async(ownerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                .input('ccompania', sql.Int, ownerData.ccompania)
                .input('cpropietario', sql.Int, ownerData.cpropietario)
                .input('xnombre', sql.NVarChar, ownerData.xnombre)
                .input('xapellido', sql.NVarChar, ownerData.xapellido)
                .input('cestadocivil', sql.Int, ownerData.cestadocivil)
                .input('fnacimiento', sql.DateTime, ownerData.fnacimiento)
                .input('xprofesion', sql.NVarChar, ownerData.xprofesion ? ownerData.xprofesion : null)
                .input('xocupacion', sql.NVarChar, ownerData.xocupacion ? ownerData.xocupacion : null)
                .input('ctipodocidentidad', sql.Int, ownerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, ownerData.xdocidentidad)
                .input('cestado', sql.Int, ownerData.cestado)
                .input('cciudad', sql.Int, ownerData.cciudad)
                .input('xdireccion', sql.NVarChar, ownerData.xdireccion)
                .input('xemail', sql.NVarChar, ownerData.xemail)
                .input('xtelefonocasa', sql.NVarChar, ownerData.xtelefonocasa ? ownerData.xtelefonocasa : null)
                .input('xtelefonocelular', sql.NVarChar, ownerData.xtelefonocelular)
                .input('xfax', sql.NVarChar, ownerData.xfax ? ownerData.xfax : null)
                .input('cparentesco', sql.Int, ownerData.cparentesco)
                .input('bactivo', sql.Bit, ownerData.bactivo)
                .input('cusuariomodificacion', sql.Int, ownerData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update TRPROPIETARIO set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, CESTADOCIVIL = @cestadocivil, FNACIMIENTO = @fnacimiento, XPROFESION = @xprofesion, XOCUPACION = @xocupacion, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCION = @xdireccion, XEMAIL = @xemail, XTELEFONOCASA = @xtelefonocasa, XTELEFONOCELULAR = @xtelefonocelular, XFAX = @xfax, CPARENTESCO = @cparentesco, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPROPIETARIO = @cpropietario and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDocumentsByOwnerUpdateQuery: async(documents, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let insert = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cdocumento', sql.Int, documents[i].cdocumento)
                    .input('xrutaarchivo', sql.NVarChar, documents[i].xrutaarchivo)
                    .input('cusuariocreacion', sql.Int, ownerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRDOCUMENTOPROPIETARIO (CPROPIETARIO, CDOCUMENTO, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@cpropietario, @cdocumento, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateDocumentsByOwnerUpdateQuery: async(documents, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let update = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cdocumentopropietario', sql.Int, documents[i].cdocumentopropietario)
                    .input('cdocumento', sql.Int, documents[i].cdocumento)
                    .input('xrutaarchivo', sql.NVarChar, documents[i].xrutaarchivo)
                    .input('cusuariomodificacion', sql.Int, ownerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update TRDOCUMENTOPROPIETARIO set CDOCUMENTO = @cdocumento, XRUTAARCHIVO = @xrutaarchivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDOCUMENTOPROPIETARIO = @cdocumentopropietario and CPROPIETARIO = @cpropietario');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteDocumentsByOwnerUpdateQuery: async(documents, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documents.length; i++){
                let erase = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cdocumentopropietario', sql.Int, documents[i].cdocumentopropietario)
                    .query('delete from TRDOCUMENTOPROPIETARIO where CDOCUMENTOPROPIETARIO = @cdocumentopropietario and CPROPIETARIO = @cpropietario');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    verifyVehiclePlateToCreateQuery: async(xplaca, cpais) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .input('xplaca', sql.NVarChar, xplaca)
                .query('select * from TRVEHICULOPROPIETARIO where XPLACA = @xplaca and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getOwnerVehiclesDataQuery: async(cpropietario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpropietario', sql.Int, cpropietario)
                .query('select * from VWBUSCARVEHICULOXPROPIETARIODATA where CPROPIETARIO = @cpropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyVehiclePlateToUpdateQuery: async(verifyData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), verifyData.cpais)
                .input('xplaca', sql.NVarChar, verifyData.xplaca)
                .input('cvehiculopropietario', sql.Int, verifyData.cvehiculopropietario)
                .query('select * from TRVEHICULOPROPIETARIO where XPLACA = @xplaca and CPAIS = @cpais and CVEHICULOPROPIETARIO != @cvehiculopropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createVehiclesByOwnerUpdateQuery: async(vehicles, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicles.length; i++){
                let insert = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cmarca', sql.Int, vehicles[i].cmarca)
                    .input('cmodelo', sql.Int, vehicles[i].cmodelo)
                    .input('cversion', sql.Int, vehicles[i].cversion)
                    .input('xplaca', sql.NVarChar, vehicles[i].xplaca)
                    .input('fano', sql.Numeric(4, 0), vehicles[i].fano)
                    .input('ccolor', sql.Int, vehicles[i].ccolor)
                    .input('nkilometraje', sql.Numeric(11, 2), vehicles[i].nkilometraje)
                    .input('bimportado', sql.Bit, vehicles[i].bimportado)
                    .input('xcertificadoorigen', sql.NVarChar, vehicles[i].xcertificadoorigen)
                    .input('mpreciovehiculo', sql.Numeric(11, 2), vehicles[i].mpreciovehiculo)
                    .input('xserialcarroceria', sql.NVarChar, vehicles[i].xserialcarroceria)
                    .input('xserialmotor', sql.NVarChar, vehicles[i].xserialmotor)
                    .input('cpais', sql.Numeric(4, 0), ownerData.cpais)
                    .input('cusuariocreacion', sql.Int, ownerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRVEHICULOPROPIETARIO (CPROPIETARIO, CMARCA, CMODELO, CVERSION, XPLACA, FANO, CCOLOR, NKILOMETRAJE, BIMPORTADO, XCERTIFICADOORIGEN, MPRECIOVEHICULO, XSERIALCARROCERIA, XSERIALMOTOR, CPAIS, CUSUARIOCREACION, FCREACION) values (@cpropietario, @cmarca, @cmodelo, @cversion, @xplaca, @fano, @ccolor, @nkilometraje, @bimportado, @xcertificadoorigen, @mpreciovehiculo, @xserialcarroceria, @xserialmotor, @cpais, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateVehiclesByOwnerUpdateQuery: async(vehicles, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicles.length; i++){
                let update = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cvehiculopropietario', sql.Int, vehicles[i].cvehiculopropietario)
                    .input('cmarca', sql.Int, vehicles[i].cmarca)
                    .input('cmodelo', sql.Int, vehicles[i].cmodelo)
                    .input('cversion', sql.Int, vehicles[i].cversion)
                    .input('xplaca', sql.NVarChar, vehicles[i].xplaca)
                    .input('fano', sql.Numeric(4, 0), vehicles[i].fano)
                    .input('ccolor', sql.Int, vehicles[i].ccolor)
                    .input('nkilometraje', sql.Numeric(11, 2), vehicles[i].nkilometraje)
                    .input('bimportado', sql.Bit, vehicles[i].bimportado)
                    .input('xcertificadoorigen', sql.NVarChar, vehicles[i].xcertificadoorigen)
                    .input('mpreciovehiculo', sql.Numeric(11, 2), vehicles[i].mpreciovehiculo)
                    .input('xserialcarroceria', sql.NVarChar, vehicles[i].xserialcarroceria)
                    .input('xserialmotor', sql.NVarChar, vehicles[i].xserialmotor)
                    .input('cusuariomodificacion', sql.Int, ownerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update TRVEHICULOPROPIETARIO set CMARCA = @cmarca, CMODELO = @cmodelo, CVERSION = @cversion, XPLACA = @xplaca, FANO = @fano, CCOLOR = @ccolor, NKILOMETRAJE = @nkilometraje, BIMPORTADO = @bimportado, XCERTIFICADOORIGEN = @xcertificadoorigen, MPRECIOVEHICULO = @mpreciovehiculo, XSERIALCARROCERIA = @xserialcarroceria, XSERIALMOTOR = @xserialmotor, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CVEHICULOPROPIETARIO = @cvehiculopropietario and CPROPIETARIO = @cpropietario');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteVehiclesByOwnerUpdateQuery: async(vehicles, ownerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicles.length; i++){
                let erase = await pool.request()
                    .input('cpropietario', sql.Int, ownerData.cpropietario)
                    .input('cvehiculopropietario', sql.Int, vehicles[i].cvehiculopropietario)
                    .query('delete from TRVEHICULOPROPIETARIO where CVEHICULOPROPIETARIO = @cvehiculopropietario and CPROPIETARIO = @cpropietario');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchProficientQuery: async(searchData) => {
        try{
            let query = `select * from TRPERITO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xperito ? " and XPERITO like '%" + searchData.xperito + "%'" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xrazonsocial ? " and XRAZONSOCIAL like '%" + searchData.xrazonsocial + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xperito', sql.NVarChar, searchData.xperito ? searchData.xperito : 1)
                .input('xrazonsocial', sql.NVarChar, searchData.xrazonsocial ? searchData.xrazonsocial : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProficientIdentificationToCreateQuery: async(proficientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                .input('ccompania', sql.Int, proficientData.ccompania)
                .input('ctipodocidentidad', sql.Int, proficientData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, proficientData.xdocidentidad)
                .query('select * from TRPERITO where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createProficientQuery: async(proficientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                .input('ccompania', sql.Int, proficientData.ccompania)
                .input('ctipodocidentidad', sql.Int, proficientData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, proficientData.xdocidentidad)
                .input('cestado', sql.Int, proficientData.cestado)
                .input('cciudad', sql.Int, proficientData.cciudad)
                .input('xperito', sql.NVarChar, proficientData.xperito)
                .input('xrazonsocial', sql.NVarChar, proficientData.xrazonsocial)
                .input('xtelefono', sql.NVarChar, proficientData.xtelefono)
                .input('centeimpuesto', sql.NVarChar, proficientData.centeimpuesto)
                .input('ldiascredito', sql.Int, proficientData.ldiascredito)
                .input('xemail', sql.NVarChar, proficientData.xemail ? proficientData.xemail : null)
                .input('xfax', sql.NVarChar, proficientData.xfax ? proficientData.xfax : null)
                .input('pretencion', sql.Numeric(5, 2), proficientData.pretencion ? proficientData.pretencion : null)
                .input('xpaginaweb', sql.NVarChar, proficientData.xpaginaweb ? proficientData.xpaginaweb : null)
                .input('xdireccion', sql.NVarChar, proficientData.xdireccion)
                .input('xdireccioncorreo', sql.NVarChar, proficientData.xdireccioncorreo)
                .input('xobservacion', sql.NVarChar, proficientData.xobservacion)
                .input('bafiliado', sql.Bit, proficientData.bafiliado)
                .input('bactivo', sql.Bit, proficientData.bactivo)
                .input('cusuariocreacion', sql.Int, proficientData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TRPERITO (CPAIS, CCOMPANIA, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, CESTADO, CCIUDAD, XPERITO, XRAZONSOCIAL, XTELEFONO, CENTEIMPUESTO, LDIASCREDITO, XEMAIL, XFAX, PRETENCION, XPAGINAWEB, XDIRECCION, XDIRECCIONCORREO, XOBSERVACION, BAFILIADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @ctipodocidentidad, @xdocidentidad, @cestado, @cciudad, @xperito, @xrazonsocial, @xtelefono, @centeimpuesto, @ldiascredito, @xemail, @xfax, @pretencion, @xpaginaweb, @xdireccion, @xdireccioncorreo, @xobservacion, @bafiliado, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                    .input('ccompania', sql.Int, proficientData.ccompania)
                    .input('ctipodocidentidad', sql.Int, proficientData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, proficientData.xdocidentidad)
                    .query('select * from TRPERITO where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getProficientDataQuery: async(proficientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                .input('ccompania', sql.Int, proficientData.ccompania)
                .input('cperito', sql.Int, proficientData.cperito)
                .query('select * from TRPERITO where CPERITO = @cperito and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyProficientIdentificationToUpdateQuery: async(proficientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                .input('ccompania', sql.Int, proficientData.ccompania)
                .input('cperito', sql.NVarChar, proficientData.cperito)
                .input('ctipodocidentidad', sql.Int, proficientData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, proficientData.xdocidentidad)
                .query('select * from TRPERITO where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CPERITO != @cperito');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateProficientQuery: async(proficientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), proficientData.cpais)
                .input('ccompania', sql.Int, proficientData.ccompania)
                .input('cperito', sql.Int, proficientData.cperito)
                .input('xperito', sql.NVarChar, proficientData.xperito)
                .input('ctipodocidentidad', sql.Int, proficientData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, proficientData.xdocidentidad)
                .input('xrazonsocial', sql.NVarChar, proficientData.xrazonsocial)
                .input('cestado', sql.Int, proficientData.cestado)
                .input('cciudad', sql.Int, proficientData.cciudad)
                .input('xdireccion', sql.NVarChar, proficientData.xdireccion)
                .input('xdireccioncorreo', sql.NVarChar, proficientData.xdireccioncorreo)
                .input('xtelefono', sql.NVarChar, proficientData.xtelefono)
                .input('xfax', sql.NVarChar, proficientData.xfax ? proficientData.xfax : null)
                .input('pretencion', sql.Numeric(5, 2), proficientData.pretencion ? proficientData.pretencion : null)
                .input('centeimpuesto', sql.NVarChar, proficientData.centeimpuesto)
                .input('ldiascredito', sql.Int, proficientData.ldiascredito)
                .input('xemail', sql.NVarChar, proficientData.xemail ? proficientData.xemail : null)
                .input('bafiliado', sql.Bit, proficientData.bafiliado)
                .input('xpaginaweb', sql.NVarChar, proficientData.xpaginaweb ? proficientData.xpaginaweb : null)
                .input('xobservacion', sql.NVarChar, proficientData.xobservacion)
                .input('bactivo', sql.Bit, proficientData.bactivo)
                .input('cusuariomodificacion', sql.Int, proficientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update TRPERITO set XPERITO = @xperito, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XRAZONSOCIAL = @xrazonsocial, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCION = @xdireccion, XDIRECCIONCORREO = @xdireccioncorreo, XTELEFONO = @xtelefono, XFAX = @xfax, PRETENCION = @pretencion, CENTEIMPUESTO = @centeimpuesto, LDIASCREDITO = @ldiascredito, XEMAIL = @xemail, BAFILIADO = @bafiliado, XPAGINAWEB = @xpaginaweb, XOBSERVACION = @xobservacion, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPERITO = @cperito and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchParentPolicyQuery: async(searchData) => {
        try{
            let query = `SELECT * FROM VWBUSCARPOLIZAMATRIZ WHERE CCOMPANIA = @CCOMPANIA AND CPAIS = @CPAIS AND BACTIVO = 1${ searchData.ccarga ? " AND CCARGA = @CCARGA" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CCOMPANIA', sql.Int, searchData.ccompania)
                .input('CPAIS', sql.Int, searchData.cpais)
                .input('CCARGA', sql.Int, searchData.ccarga ? searchData.ccarga : undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
;
            return { error: err.message };
        }
    },
    searchFleetContractManagementQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARCONTRATOFLOTADATA where CCOMPANIA = @ccompania${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.ccarga ? " and ccarga = @ccarga" : '' }${ searchData.clote ? " and clote = @clote" : '' }${ searchData.xplaca ? " and XPLACA = @xplaca" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : undefined)
                .input('ccarga', sql.Int, searchData.ccarga ? searchData.ccarga : undefined)
                .input('clote', sql.Int, searchData.clote ? searchData.clote : undefined)
                //.input('crecibo', sql.Int, searchData.crecibo ? searchData.crecibo : 1)
                //.input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                //.input('cmodelo', sql.Int, searchData.cmodelo ? searchData.cmodelo : 1)           esto va en el query
                //.input('cversion', sql.Int, searchData.cversion ? searchData.cversion : 1) ----   ${ searchData.cmarca ? " and CMARCA = @cmarca" : '' }${ searchData.cmodelo ? " and CMODELO = @cmodelo" : '' }${ searchData.cversion ? " and CVERSION = @cversion" : '' }
                .input('xplaca', sql.NVarChar, searchData.xplaca ? searchData.xplaca : undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchClientWorkerQuery: async(searchData) => {
        try{
            let query = `select * from CLTRABAJADOR where CCLIENTE = @ccliente${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }${ searchData.xnombre ? " and XNOMBRE like '%" + searchData.xnombre + "%'" : '' }${ searchData.xapellido ? " and XAPELLIDO like '%" + searchData.xapellido + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xnombre', sql.NVarChar, searchData.xnombre ? searchData.xnombre : 1)
                .input('xapellido', sql.NVarChar, searchData.xapellido ? searchData.xapellido : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchOwnerVehicleQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARVEHICULOXPROPIETARIODATA where CPROPIETARIO = @cpropietario${ searchData.xplaca ? " and XPLACA like '%" + searchData.xplaca + "%'" : '' }${ searchData.cmarca ? " and CMARCA = @cmarca" : '' }${ searchData.cmodelo ? " and CMODELO = @cmodelo" : '' }${ searchData.cversion ? " and CVERSION = @cversion" : '' }${ searchData.xserialcarroceria ? " and XSERIALCARROCERIA like '%" + searchData.xserialcarroceria + "%'" : '' }${ searchData.xserialmotor ? " and XSERIALMOTOR like '%" + searchData.xserialmotor + "%'" : ''}${ searchData.cmoneda ? " and CMONEDA = @cmoneda" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpropietario', sql.Int, searchData.cpropietario ? searchData.cpropietario : 1)
                .input('xplaca', sql.NVarChar, searchData.xplaca ? searchData.xplaca : 1)
                .input('cmarca', sql.Int, searchData.cmarca ? searchData.cmarca : 1)
                .input('cmodelo', sql.Int, searchData.cmodelo ? searchData.cmodelo : 1)
                .input('cversion', sql.Int, searchData.cversion ? searchData.cversion : 1)
                .input('xserialcarroceria', sql.NVarChar, searchData.xserialcarroceria ? searchData.xserialcarroceria : 1)
                .input('xserialmotor', sql.NVarChar, searchData.xserialmotor ? searchData.xserialmotor : 1)
                .input('cmoneda', sql.Int, searchData.cmoneda ? searchData.cmoneda : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchVehicleTypeFeeQuery: async(searchData, cregistrotasa) => {
        try{
            let query = `select * from CTTIPOVEHICULOREGISTROTASA where CTIPOVEHICULO = @ctipovehiculo and CREGISTROTASA = @cregistrotasa`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ctipovehiculo', sql.Int, searchData.ctipovehiculo)
                .input('cregistrotasa', sql.Int, cregistrotasa)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchRangeFeeQuery: async(searchData, ctipovehiculoregistrotasa) => {
        try{
            let query = `select * from CTRANGOANOTIPOVEHICULO where CTIPOVEHICULOREGISTROTASA = @ctipovehiculoregistrotasa and @fano between FANOINICIO and FANOFINAL`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ctipovehiculoregistrotasa', sql.Int, ctipovehiculoregistrotasa)
                .input('fano', sql.Numeric, searchData.fano)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchRoadManagementQuery: async(searchData) => {
        try{
            let query = `select * from CTCONFIGURACIONGESTIONVIAL where CPAIS = @cpais and CCOMPANIA = @ccompania and CCLIENTE = @ccliente and CASOCIADO = @casociado`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ccliente', sql.Int, searchData.ccliente)
                .input('casociado', sql.Int, searchData.casociado)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchVehicleTypeRoadManagementQuery: async(searchData, cconfiguraciongestionvial) => {
        try{
            let query = `select * from CTTIPOVEHICULOCONFIGURACIONGESTIONVIAL where CCONFIGURACIONGESTIONVIAL = @cconfiguraciongestionvial and CTIPOVEHICULO = @ctipovehiculo`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cconfiguraciongestionvial', sql.Int, cconfiguraciongestionvial)
                .input('ctipovehiculo', sql.Int, searchData.ctipovehiculo)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    accesoryValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from MAACCESORIOS');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    proficientValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CPERITO, XPERITO, BACTIVO from TRPERITO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    inspectionTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOINSPECCION, XTIPOINSPECCION, BACTIVO from MATIPOINSPECCION where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyFleetContractVehicleToCreateQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('cpropietario', sql.Int, fleetContractData.cpropietario)
                .input('cvehiculopropietario', sql.Int, fleetContractData.cvehiculopropietario)
                .query('select * from SUCONTRATOFLOTA where CPROPIETARIO = @cpropietario and CVEHICULOPROPIETARIO = @cvehiculopropietario and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createFleetContractQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('ccliente', sql.Int, fleetContractData.ccliente)
                .input('casociado', sql.Int, fleetContractData.casociado)
                .input('cagrupador', sql.Int, fleetContractData.cagrupador)
                .input('finicio', sql.DateTime, fleetContractData.finicio)
                .input('fhasta', sql.DateTime, fleetContractData.fhasta)
                .input('cestatusgeneral', sql.Int, fleetContractData.cestatusgeneral)
                .input('xcertificadoasociado', sql.NVarChar, fleetContractData.xcertificadoasociado)
                .input('xsucursalemision', sql.NVarChar, fleetContractData.xsucursalemision)
                .input('xsucursalsuscriptora', sql.NVarChar, fleetContractData.xsucursalsuscriptora)
                .input('ctrabajador', sql.Int, fleetContractData.ctrabajador)
                .input('cpropietario', sql.Int, fleetContractData.cpropietario)
                .input('cvehiculopropietario', sql.Int, fleetContractData.cvehiculopropietario)
                .input('ctipoplan', sql.Int, fleetContractData.ctipoplan)
                .input('cplan', sql.Int, fleetContractData.cplan)
                .input('cmetodologiapago', sql.Int, fleetContractData.cmetodologiapago)
                .input('ctiporecibo', sql.Int, fleetContractData.ctiporecibo)
                .input('fhastarecibo', sql.DateTime, fleetContractData.fhastarecibo)
                .input('bactivo', sql.Bit, fleetContractData.bactivo)
                .input('cusuariocreacion', sql.Int, fleetContractData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into SUCONTRATOFLOTA (CPAIS, CCOMPANIA, CCLIENTE, CASOCIADO, CAGRUPADOR, FINICIO, CESTATUSGENERAL, XCERTIFICADOASOCIADO, CTRABAJADOR, CPROPIETARIO, CVEHICULOPROPIETARIO, BACTIVO, CUSUARIOCREACION, FCREACION, FHASTA, CTIPOPLAN, CPLAN, CMETODOLOGIAPAGO, XSUCURSALEMISION, XSUCURSALSUSCRIPTORA, CTIPORECIBO, FHASTARECIBO) values (@cpais, @ccompania, @ccliente, @casociado, @cagrupador, @finicio, @cestatusgeneral, @xcertificadoasociado, @ctrabajador, @cpropietario, @cvehiculopropietario, @bactivo, @cusuariocreacion, @fcreacion, @fhasta, @ctipoplan, @cplan, @cmetodologiapago, @xsucursalemision, @xsucursalsuscriptora. @ctiporecibo, @fhastarecibo)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                    .input('ccompania', sql.Int, fleetContractData.ccompania)
                    .input('cpropietario', sql.Int, fleetContractData.cpropietario)
                    .input('cvehiculopropietario', sql.Int, fleetContractData.cvehiculopropietario)
                    .query('select * from SUCONTRATOFLOTA where CPROPIETARIO = @cpropietario and CVEHICULOPROPIETARIO = @cvehiculopropietario and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && fleetContractData.inspections){
                    for(let i = 0; i < fleetContractData.inspections.length; i++){
                        let insert = await pool.request()
                            .input('ccontratoflota', sql.Int, query.recordset[0].CCONTRATOFLOTA)
                            .input('cperito', sql.Int, fleetContractData.inspections[i].cperito)
                            .input('ctipoinspeccion', sql.Int, fleetContractData.inspections[i].ctipoinspeccion)
                            .input('finspeccion', sql.DateTime, fleetContractData.inspections[i].finspeccion)
                            .input('xobservacion', sql.NVarChar, fleetContractData.inspections[i].xobservacion)
                            .input('cusuariocreacion', sql.Int, fleetContractData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into SUINSPECCIONCONTRATOFLOTA (CCONTRATOFLOTA, CPERITO, CTIPOINSPECCION, FINSPECCION, XOBSERVACION, CUSUARIOCREACION, FCREACION) output inserted.CINSPECCIONCONTRATOFLOTA values (@ccontratoflota, @cperito, @ctipoinspeccion, @finspeccion, @xobservacion, @cusuariocreacion, @fcreacion)')
                        if(fleetContractData.inspections[i].images){
                            for(let j = 0; j < fleetContractData.inspections[i].images.length; j++){
                                let subInsert = await pool.request()
                                    .input('cinspeccioncontratoflota', sql.Int, insert.recordset[0].CINSPECCIONCONTRATOFLOTA)
                                    .input('xrutaimagen', sql.NVarChar, fleetContractData.inspections[i].images[j].xrutaimagen)
                                    .input('cusuariocreacion', sql.Int, fleetContractData.cusuariocreacion)
                                    .input('fcreacion', sql.DateTime, new Date())
                                    .query('insert into SUIMAGENINSPECCION (CINSPECCIONCONTRATOFLOTA, XRUTAIMAGEN, CUSUARIOCREACION, FCREACION) values (@cinspeccioncontratoflota, @xrutaimagen, @cusuariocreacion, @fcreacion)')
                            }
                        }
                    }
                }
                if(query.rowsAffected > 0 && fleetContractData.accesories){
                    for(let i = 0; i < fleetContractData.accesories.length; i++){
                        let insert = await pool.request()
                            .input('ccontratoflota', sql.Int, query.recordset[0].CCONTRATOFLOTA)
                            .input('caccesorio', sql.Int, fleetContractData.accesories[i].caccesorio)
                            .input('maccesoriocontratoflota', sql.Numeric(11, 2), fleetContractData.accesories[i].maccesoriocontratoflota)
                            .input('cusuariocreacion', sql.Int, fleetContractData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into SUACCESORIOCONTRATOFLOTA (CCONTRATOFLOTA, CACCESORIO, MACCESORIOCONTRATOFLOTA, CUSUARIOCREACION, FCREACION) values (@ccontratoflota, @caccesorio, @maccesoriocontratoflota, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },

    createIndividualContractQuery: async(userData, paymentList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let insert = await pool.request()
                .input('xnombre', sql.NVarChar, userData.xnombre ? userData.xnombre: undefined)
                .input('xapellido', sql.NVarChar, userData.xapellido)
                .input('cano', sql.Numeric(11, 0), userData.cano)
                .input('xcolor', sql.NVarChar, userData.xcolor)
                .input('cmarca', sql.Int, userData.cmarca)
                .input('cmodelo', sql.Int, userData.cmodelo)
                .input('cversion', sql.Int, userData.cversion)
                .input('xrif_cliente', sql.NVarChar, userData.xrif_cliente)
                .input('email', sql.NVarChar, userData.email)
                .input('xtelefono_prop', sql.NVarChar , userData.xtelefono_prop)
                .input('xdireccionfiscal', sql.NVarChar, userData.xdireccionfiscal)
                .input('xserialmotor', sql.NVarChar, userData.xserialmotor)
                .input('xserialcarroceria', sql.NVarChar, userData.xserialcarroceria)
                .input('xplaca', sql.NVarChar, userData.xplaca)
                .input('xtelefono_emp', sql.NVarChar, userData.xtelefono_emp)
                .input('cplan', sql.Numeric(11, 0), userData.cplan)
                .input('ccorredor', sql.Numeric(11, 0), userData.ccorredor)
                .input('xcedula', sql.NVarChar, userData.xcedula)
                .input('cproductor', sql.Numeric(11, 0), userData.cproductor)
                .input('xcobertura', sql.NVarChar, userData.xcobertura)
                .input('ncapacidad_p', sql.NVarChar, userData.ncapacidad_p)
                .input('ctarifa_exceso', sql.Int, userData.ctarifa_exceso)
                .input('finicio',  sql.DateTime, new Date())
                .input('femision',  sql.DateTime, userData.femision)
                .input('cmetodologiapago', sql.Numeric(11, 0), userData.cmetodologiapago)
                .input('msuma_aseg', sql.Numeric(11, 2), userData.msuma_aseg)
                .input('pcasco', sql.Numeric(11, 2), userData.pcasco)
                .input('mprima_casco', sql.Numeric(11, 2), userData.mprima_casco)
                .input('mcatastrofico', sql.Numeric(11, 2), userData.mcatastrofico)
                .input('pdescuento', sql.Numeric(17, 2), userData.pdescuento)
                .input('ifraccionamiento', sql.Bit, userData.ifraccionamiento)
                .input('ncuotas', sql.Int, userData.ncuotas)
                .input('ccodigo_ubii', sql.Int, userData.ccodigo_ubii ? paymentList.ccodigo_ubii: undefined)
                .input('mprima_blindaje', sql.Numeric(11, 2), userData.mprima_blindaje)
                .input('msuma_blindaje', sql.Numeric(11, 2), userData.msuma_blindaje)
                .input('mprima_bruta', sql.Numeric(11, 2), userData.mprima_bruta)
                .input('pcatastrofico', sql.Numeric(11, 2), userData.pcatastrofico)
                .input('pmotin', sql.Numeric(11, 2), userData.pmotin)
                .input('mmotin', sql.Numeric(11, 2), userData.mmotin)
                .input('pblindaje', sql.Numeric(11, 2), userData.pblindaje)
                .input('cestado', sql.Numeric(11, 0), userData.cestado)
                .input('cciudad', sql.Numeric(11, 0), userData.cciudad)
                .input('cpais', sql.Numeric(11, 0), userData.cpais)
                .input('icedula', sql.NVarChar, userData.icedula)
                .input('ivigencia', sql.Int, userData.ivigencia)
                .input('ctipopago', sql.Int, paymentList.ctipopago ? paymentList.ctipopago: 0)
                .input('cbanco', sql.Int, paymentList.cbanco ? paymentList.cbanco: 0)
                .input('cbanco_destino', sql.Int, paymentList.cbanco_destino ? paymentList.cbanco_destino: 0)
                .input('xreferencia', sql.NVarChar, paymentList.xreferencia ? paymentList.xreferencia: 0)
                .input('fcobro', sql.DateTime, paymentList.fcobro ? paymentList.fcobro: 0)
                .input('mprima_pagada', sql.Numeric(18, 2), paymentList.mprima_pagada ? paymentList.mprima_pagada: 0)
                .input('mprima_bs', sql.Numeric(18, 2), paymentList.mprima_bs ? paymentList.mprima_bs: undefined)
                .input('xnota', sql.NVarChar, paymentList.xnota ? paymentList.xnota: undefined)
                .input('mtasa_cambio', sql.Numeric(18, 2), paymentList.mtasa_cambio ? paymentList.mtasa_cambio: undefined)
                .input('ftasa_cambio', sql.DateTime, paymentList.ftasa_cambio ? paymentList.ftasa_cambio: undefined)
                .input('mgrua', sql.NVarChar ,userData.mgrua)
                .input('cestatusgeneral', sql.Int, paymentList.cestatusgeneral ? paymentList.cestatusgeneral: 13)
                .input('ctomador', sql.Int, userData.ctomador ? userData.ctomador: 0)
                .input('cusuariocreacion', sql.Int, userData.cusuario ? userData.cusuario: 0)
                .input('xzona_postal', sql.NVarChar, userData.xzona_postal)
                .input('cuso', sql.NVarChar, userData.cuso)
                .input('ctipovehiculo', sql.Int, userData.ctipovehiculo)
                .input('nkilometraje', sql.Numeric(18, 2), userData.nkilometraje)
                .input('cclase', sql.Int, userData.cclase)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TMEMISION_INDIVIDUAL(XNOMBRE, XAPELLIDO, CANO, XCOLOR, CMARCA, CMODELO, CVERSION, XRIF_CLIENTE, EMAIL, XTELEFONO_PROP, XDIRECCIONFISCAL, XSERIALMOTOR, XSERIALCARROCERIA, XPLACA, XTELEFONO_EMP, CPLAN, CCORREDOR, XCEDULA, XCOBERTURA, NCAPACIDAD_P, CTARIFA_EXCESO, FINICIO, CMETODOLOGIAPAGO, MSUMA_ASEG, PCASCO, MPRIMA_CASCO, MCATASTROFICO, PDESCUENTO, IFRACCIONAMIENTO, NCUOTAS, MPRIMA_BLINDAJE, MSUMA_BLINDAJE, MPRIMA_BRUTA, PCATASTROFICO, PMOTIN, MMOTIN, PBLINDAJE, CESTADO, CCIUDAD, CPAIS, ICEDULA, FEMISION, IVIGENCIA, CTIPOPAGO, XREFERENCIA, FCOBRO, CBANCO, CBANCO_DESTINO, MPRIMA_PAGADA, MPRIMA_BS, XNOTA, MTASA_CAMBIO, FTASA_CAMBIO,CCODIGO_UBII, MGRUA, CESTATUSGENERAL, CTOMADOR, XZONA_POSTAL,CUSO ,CTIPOVEHICULO, FCREACION, CUSUARIOCREACION, NKILOMETRAJE, CCLASE) values (@xnombre, @xapellido, @cano, @xcolor, @cmarca, @cmodelo, @cversion, @xrif_cliente, @email, @xtelefono_prop, @xdireccionfiscal, @xserialmotor, @xserialcarroceria, @xplaca, @xtelefono_emp, @cplan, @ccorredor, @xcedula, @xcobertura, @ncapacidad_p, @ctarifa_exceso, @finicio, @cmetodologiapago, @msuma_aseg, @pcasco, @mprima_casco, @mcatastrofico, @pdescuento, @ifraccionamiento, @ncuotas, @mprima_blindaje, @msuma_blindaje, @mprima_bruta,@pcatastrofico ,@pmotin, @mmotin, @pblindaje, @cestado, @cciudad, @cpais, @icedula, @femision, @ivigencia, @ctipopago, @xreferencia, @fcobro, @cbanco, @cbanco_destino, @mprima_pagada, @mprima_bs, @xnota, @mtasa_cambio, @ftasa_cambio,@ccodigo_ubii, @mgrua, @cestatusgeneral, @ctomador, @xzona_postal, @cuso, @ctipovehiculo, @fcreacion, @cusuariocreacion, @nkilometraje, @cclase)')                
                 return { 
                    result: { rowsAffected: rowsAffected, status: true } 
                };
        }
    
        catch(err){

            return { error: err.message };
        }
    },
    createContractBrokerQuery: async(userData, paymentList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let insert = await pool.request()
                .input('xnombre', sql.NVarChar, userData.xnombre ? userData.xnombre: undefined)
                .input('xapellido', sql.NVarChar, userData.xapellido)
                .input('cano', sql.Numeric(11, 2), userData.cano)
                .input('xcolor', sql.NVarChar, userData.xcolor)
                .input('cmarca', sql.Int, userData.cmarca)
                .input('cmodelo', sql.Int, userData.cmodelo)
                .input('cversion', sql.Int, userData.cversion)
                .input('xrif_cliente', sql.NVarChar, userData.xrif_cliente)
                .input('email', sql.NVarChar, userData.email)
                .input('xtelefono_prop', sql.NVarChar , userData.xtelefono_prop)
                .input('xdireccionfiscal', sql.NVarChar, userData.xdireccionfiscal)
                .input('xserialmotor', sql.NVarChar, userData.xserialmotor)
                .input('xserialcarroceria', sql.NVarChar, userData.xserialcarroceria)
                .input('xplaca', sql.NVarChar, userData.xplaca)
                .input('xtelefono_emp', sql.NVarChar, userData.xtelefono_emp)
                .input('cplan', sql.Numeric(11, 0), userData.cplan)
                .input('ccorredor', sql.Numeric(11, 0), userData.ccorredor)
                .input('xcedula', sql.NVarChar, userData.xcedula)
                .input('cproductor', sql.Numeric(11, 0), userData.cproductor)
                .input('ctarifa_exceso', sql.Int, userData.ctarifa_exceso)
                .input('xcobertura', sql.NVarChar, userData.xcobertura)
                .input('ncapacidad_p', sql.NVarChar, userData.ncapacidad_p)
                .input('finicio',  sql.DateTime, new Date())
                .input('femision',  sql.DateTime, userData.femision)
                .input('cmetodologiapago', sql.Numeric(11, 0), userData.cmetodologiapago)
                .input('msuma_aseg', sql.Numeric(11, 0), userData.msuma_aseg)
                .input('pcasco', sql.Numeric(11, 0), userData.pcasco)
                .input('mprima_casco', sql.Numeric(11, 0), userData.mprima_casco)
                .input('mcatastrofico', sql.Numeric(11, 0), userData.mcatastrofico)
                .input('pdescuento', sql.Numeric(17, 2), userData.pdescuento)
                .input('ifraccionamiento', sql.Bit, userData.ifraccionamiento)
                .input('ncuotas', sql.Int, userData.ncuotas)
                .input('mprima_blindaje', sql.Numeric(11, 0), userData.mprima_blindaje)
                .input('msuma_blindaje', sql.Numeric(11, 0), userData.msuma_blindaje)
                .input('mprima_bruta', sql.Numeric(11, 0), userData.mprima_bruta)
                .input('pcatastrofico', sql.Numeric(11, 0), userData.pcatastrofico)
                .input('pmotin', sql.Numeric(11, 0), userData.pmotin)
                .input('mmotin', sql.Numeric(11, 0), userData.mmotin)
                .input('pblindaje', sql.Numeric(11, 0), userData.pblindaje)
                .input('cestado', sql.Numeric(11, 0), userData.cestado)
                .input('cciudad', sql.Numeric(11, 0), userData.cciudad)
                .input('cpais', sql.Numeric(11, 0), userData.cpais)
                .input('icedula', sql.NVarChar, userData.icedula)
                .input('mgrua', sql.NVarChar, userData.mgrua)
                .input('ivigencia', sql.NVarChar, userData.ivigencia)
                .input('ccodigo_ubii', sql.Int, userData.ccodigo_ubii ? paymentList.ccodigo_ubii: undefined)
                .input('ctipopago', sql.Int, paymentList.ctipopago ? paymentList.ctipopago: undefined)
                .input('cbanco', sql.Int, paymentList.cbanco ? paymentList.cbanco: undefined)
                .input('cbanco_destino', sql.Int, paymentList.cbanco_destino ? paymentList.cbanco_destino: 0)
                .input('xreferencia', sql.NVarChar, paymentList.xreferencia ? paymentList.xreferencia: undefined)
                .input('fcobro', sql.DateTime, paymentList.fcobro ? paymentList.fcobro: undefined)
                .input('mprima_pagada', sql.Numeric(18, 2), paymentList.mprima_pagada ? paymentList.mprima_pagada: undefined)
                .input('mprima_bs', sql.Numeric(18, 2), paymentList.mprima_bs ? paymentList.mprima_bs: undefined)
                .input('xnota', sql.NVarChar, paymentList.xnota ? paymentList.xnota: undefined)
                .input('mtasa_cambio', sql.Numeric(18, 2), paymentList.mtasa_cambio ? paymentList.mtasa_cambio: undefined)
                .input('ftasa_cambio', sql.DateTime, paymentList.ftasa_cambio ? paymentList.ftasa_cambio: undefined)
                .input('cestatusgeneral', sql.Int, paymentList.cestatusgeneral ? paymentList.cestatusgeneral: 13)
                .input('ctomador', sql.Int, userData.ctomador ? userData.ctomador: 0)
                .input('cusuariocreacion', sql.Int, userData.cusuario ? userData.cusuario: 0)
                .input('xzona_postal', sql.NVarChar, userData.xzona_postal)
                .input('xuso', sql.NVarChar, userData.xuso)
                .input('xtipo', sql.NVarChar, userData.xtipo)
                .input('nkilometraje', sql.Int, userData.nkilometraje)
                .input('xclase', sql.NVarChar, userData.xclase)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TMEMISION_INDIVIDUAL(XNOMBRE, XAPELLIDO, CANO, XCOLOR, CMARCA, CMODELO, CVERSION, XRIF_CLIENTE, EMAIL, XTELEFONO_PROP, XDIRECCIONFISCAL, XSERIALMOTOR, XSERIALCARROCERIA, XPLACA, XTELEFONO_EMP, CPLAN, CPRODUCTOR, CCORREDOR, XCEDULA, XCOBERTURA, NCAPACIDAD_P, XTIPO, CTARIFA_EXCESO, FINICIO, CMETODOLOGIAPAGO, MSUMA_ASEG, PCASCO, MPRIMA_CASCO, MCATASTROFICO, PDESCUENTO, IFRACCIONAMIENTO, NCUOTAS, MPRIMA_BLINDAJE, MSUMA_BLINDAJE, MPRIMA_BRUTA, PCATASTROFICO, PMOTIN, MMOTIN, PBLINDAJE, CESTADO, CCIUDAD, CPAIS, ICEDULA, FEMISION, IVIGENCIA, CCODIGO_UBII, CTIPOPAGO, XREFERENCIA, FCOBRO, CBANCO, CBANCO_DESTINO, MPRIMA_PAGADA, MPRIMA_BS, XNOTA, MTASA_CAMBIO, FTASA_CAMBIO, MGRUA, CESTATUSGENERAL, CTOMADOR, XZONA_POSTAL, XUSO, FCREACION, CUSUARIOCREACION, NKILOMETRAJE, XCLASE) values (@xnombre, @xapellido, @cano, @xcolor, @cmarca, @cmodelo, @cversion, @xrif_cliente, @email, @xtelefono_prop, @xdireccionfiscal, @xserialmotor, @xserialcarroceria, @xplaca, @xtelefono_emp, @cplan, @cproductor, @ccorredor, @xcedula, @xcobertura, @ncapacidad_p, @xtipo, @ctarifa_exceso, @finicio, @cmetodologiapago, @msuma_aseg, @pcasco, @mprima_casco, @mcatastrofico, @pdescuento, @ifraccionamiento, @ncuotas, @mprima_blindaje, @msuma_blindaje, @mprima_bruta,@pcatastrofico ,@pmotin, @mmotin, @pblindaje, @cestado, @cciudad, @cpais, @icedula, @femision, @ivigencia,@ccodigo_ubii, @ctipopago, @xreferencia, @fcobro, @cbanco, @cbanco_destino, @mprima_pagada, @mprima_bs, @xnota, @mtasa_cambio, @ftasa_cambio, @mgrua, @cestatusgeneral, @ctomador, @xzona_postal, @xuso, @fcreacion, @cusuariocreacion, @nkilometraje, @xclase)')
            //sql.close();
            return { result: { rowsAffected: rowsAffected, status: true } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getLastReceipt: async(xplaca, ccontratoflota) => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xplaca', sql.NVarChar, xplaca)
                .input('ccontratoflota', sql.Int, ccontratoflota)
                .query('SELECT TOP 1 CCARGA, CRECIBO, FEMISION, FDESDE_POL, FHASTA_POL, FDESDE_REC, FHASTA_REC, XRECIBO FROM SURECIBO WHERE XPLACA = @xplaca and CCONTRATOFLOTA = @ccontratoflota ORDER BY CRECIBO DESC')
            return { ccarga: result.recordset[0].CCARGA, crecibo: result.recordset[0].CRECIBO, femision: result.recordset[0].FEMISION, fdesde_pol: result.recordset[0].FDESDE_POL, fhasta_pol: result.recordset[0].FHASTA_POL, crecibo: result.recordset[0].CRECIBO, fdesde_rec: result.recordset[0].FDESDE_REC, fhasta_rec: result.recordset[0].FHASTA_REC, xrecibo: result.recordset[0].XRECIBO };
        }catch(err) {
;
            return { error: err.message };
        }
    },
    getCharge: async(ccarga) => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccarga', sql.Int, ccarga)
                .query('SELECT XDESCRIPCION_L, XPOLIZA, FINGRESO FROM SUPOLIZAMATRIZ WHERE CCARGA = @ccarga')
            return { xdescripcion_l: result.recordset[0].XDESCRIPCION_L, xpoliza: result.recordset[0].XPOLIZA, fsuscripcion: result.recordset[0].FINGRESO };
        }catch(err) {
;
            return { error: err.message };
        }
    },
    getLastFleetContract: async() => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('SELECT TOP 1 CCONTRATOFLOTA, CCLIENTE, CPROPIETARIO, CVEHICULOPROPIETARIO FROM SUCONTRATOFLOTA ORDER BY CCONTRATOFLOTA DESC')
            return { ccontratoflota: result.recordset[0].CCONTRATOFLOTA, ccliente: result.recordset[0].CCLIENTE, cpropietario: result.recordset[0].CPROPIETARIO, cvehiculopropietario: result.recordset[0].CVEHICULOPROPIETARIO };
        }catch(err) {
;
            return { error: err.message };
        }
    },
    getReceiptData: async(receiptData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecibo', sql.Int, receiptData.crecibo)
                .query('select * from VWBUSCARRECIBOXCODIGO where crecibo = @crecibo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getPolicyEffectiveDateQuery: async(ccontratoflota) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('ccontratoflota', sql.Int, ccontratoflota)
            .query('select top 1 FDESDE_POL, FHASTA_POL from SURECIBO where CCONTRATOFLOTA = @ccontratoflota and BACTIVO = 1');
            return { result: result };
        }catch(err){
;
            return { error: err.message };
        }
    },
    getFleetContractDataQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais ? fleetContractData.cpais: undefined)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                .query('select * from VWBUSCARSUCONTRATOFLOTADATA where CCONTRATOFLOTA = @ccontratoflota and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getParentPolicyDataQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CPAIS', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('CCOMPANIA', sql.Int, fleetContractData.ccompania)
                .input('CCARGA', sql.Int, fleetContractData.ccarga)
                .query('SELECT * FROM SUPOLIZAMATRIZ WHERE CCARGA = @CCARGA AND CPAIS = @CPAIS AND CCOMPANIA = @CCOMPANIA');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFleetContractInspectionsDataQuery: async(ccontratoflota) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccontratoflota', sql.Int, ccontratoflota)
                .query('select * from VWBUSCARINSPECCIONXCONTRATOFLOTADATA where CCONTRATOFLOTA = @ccontratoflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getBroker: async(ccorredor) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('ccorredor', sql.Int, ccorredor)
            .query('select * from macorredores where ccorredor = @ccorredor');
            return { result: result }
        }catch(err){
            return { error: err.message };
        }
    },
    getPolicyHolderData: async(ctomador) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('ctomador', sql.Int, ctomador)
            .query('select * from VWBUSCARTOMADOR where CTOMADOR = @ctomador');
            return { result: result }
        }catch(err){
;
            return { error: err.message };
        }
    },
    getImagesInspectionDataDataQuery: async(cinspeccioncontratoflota) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cinspeccioncontratoflota', sql.Int, cinspeccioncontratoflota)
                .query('select * from SUIMAGENINSPECCION where CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFleetContractAccesoriesDataQuery: async(ccontratoflota) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccontratoflota', sql.Int, ccontratoflota)
                .query('select * from VWBUSCARACCESORIOXCONTRATOFLOTADATA where CCONTRATOFLOTA = @ccontratoflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFleetContractWorkerDataQuery: async(ccliente, ctrabajador) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccliente', sql.Int, ccliente)
                .input('ctrabajador', sql.Int, ctrabajador)
                .query('select * from VWBUSCARTRABAJADORXCONTRATOFLOTADATA where CCLIENTE = @ccliente and CTRABAJADOR = @ctrabajador');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFleetContractOwnerDataQuery: async(fleetContractData, cpropietario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('cpropietario', sql.Int, cpropietario)
                .query('select * from VWBUSCARPROPIETARIOXCONTRATOFLOTADATA where  CCOMPANIA = @ccompania and CPROPIETARIO = @cpropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getFleetContractOwnerVehicleDataQuery: async(cpropietario, cvehiculopropietario) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cvehiculopropietario', sql.Int, cvehiculopropietario)
                .input('cpropietario', sql.Int, cpropietario)
                .query('select * from VWBUSCARVEHICULOPROPIETARIOXCONTRATOFLOTADATA where CPROPIETARIO = @cpropietario and CVEHICULOPROPIETARIO = @cvehiculopropietario');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyFleetContractVehicleToUpdateQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('cpropietario', sql.Int, fleetContractData.cpropietario)
                .input('cvehiculopropietario', sql.Int, fleetContractData.cvehiculopropietario)
                .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                .query('select * from SUCONTRATOFLOTA where CPROPIETARIO = @cpropietario and CVEHICULOPROPIETARIO = @cvehiculopropietario and CPAIS = @cpais and CCOMPANIA = @ccompania and CCONTRATOFLOTA != @ccontratoflota');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateFleetContractQuery: async(fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), fleetContractData.cpais)
                .input('ccompania', sql.Int, fleetContractData.ccompania)
                .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                .input('ccliente', sql.Int, fleetContractData.ccliente)
                .input('casociado', sql.Int, fleetContractData.casociado)
                .input('cagrupador', sql.Int, fleetContractData.cagrupador)
                .input('finicio', sql.DateTime, fleetContractData.finicio)
                .input('fhasta', sql.DateTime, fleetContractData.fhasta)
                .input('cestatusgeneral', sql.Int, fleetContractData.cestatusgeneral)
                .input('xcertificadoasociado', sql.NVarChar, fleetContractData.xcertificadoasociado)
                .input('xsucursalemision', sql.NVarChar, fleetContractData.xsucursalemision)
                .input('xsucursalsuscriptora', sql.NVarChar, fleetContractData.xsucursalsuscriptora)
                .input('ctrabajador', sql.Int, fleetContractData.ctrabajador)
                .input('cpropietario', sql.Int, fleetContractData.cpropietario)
                .input('cvehiculopropietario', sql.Int, fleetContractData.cvehiculopropietario)
                .input('ctipoplan', sql.Int, fleetContractData.ctipoplan)
                .input('cplan', sql.Int, fleetContractData.cplan)
                .input('cmetodologiapago', sql.Int, fleetContractData.cmetodologiapago)
                .input('ctiporecibo', sql.Int, fleetContractData.ctiporecibo)
                .input('fhastarecibo', sql.DateTime, fleetContractData.fhastarecibo)
                .input('cusuariomodificacion', sql.Int, fleetContractData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .input('xobservaciones', sql.NVarChar, fleetContractData.xobservaciones)
                .input('xanexo', sql.NVarChar, fleetContractData.xanexo)
                .query('update SUCONTRATOFLOTA set CCLIENTE = @ccliente, CASOCIADO = @casociado, CAGRUPADOR = @cagrupador, FINICIO = @finicio, CESTATUSGENERAL = @cestatusgeneral, XCERTIFICADOASOCIADO = @xcertificadoasociado, CTRABAJADOR = @ctrabajador, CPROPIETARIO = @cpropietario, CVEHICULOPROPIETARIO = @cvehiculopropietario, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, FHASTA = @fhasta, CTIPOPLAN = @ctipoplan, CPLAN = @cplan, CMETODOLOGIAPAGO = @cmetodologiapago, XSUCURSALEMISION = @xsucursalemision, XSUCURSALSUSCRIPTORA = @xsucursalsuscriptora, CTIPORECIBO = @ctiporecibo, FHASTARECIBO = @fhastarecibo, XANEXO = @xanexo, XOBSERVACIONES = @xobservaciones where CCONTRATOFLOTA = @ccontratoflota and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createAccesoriesByFleetContractUpdateQuery: async(accesories, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < accesories.length; i++){
                let insert = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('caccesorio', sql.Int, accesories[i].caccesorio)
                    .input('maccesoriocontratoflota', sql.Numeric(11, 2), accesories[i].maccesoriocontratoflota)
                    .input('cusuariocreacion', sql.Int, fleetContractData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into SUACCESORIOCONTRATOFLOTA (CCONTRATOFLOTA, CACCESORIO, MACCESORIOCONTRATOFLOTA, CUSUARIOCREACION, FCREACION) values (@ccontratoflota, @caccesorio, @maccesoriocontratoflota, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateAccesoriesByFleetContractUpdateQuery: async(accesories, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < accesories.length; i++){
                let update = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('caccesorio', sql.Int, accesories[i].caccesorio)
                    .input('maccesoriocontratoflota', sql.Numeric(11, 2), accesories[i].maccesoriocontratoflota)
                    .input('cusuariomodificacion', sql.Int, fleetContractData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update SUACCESORIOCONTRATOFLOTA set MACCESORIOCONTRATOFLOTA = @maccesoriocontratoflota, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CACCESORIO = @caccesorio and CCONTRATOFLOTA = @ccontratoflota');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteAccesoriesByFleetContractUpdateQuery: async(accesories, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < accesories.length; i++){
                let erase = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('caccesorio', sql.Int, accesories[i].caccesorio)
                    .query('delete from SUACCESORIOCONTRATOFLOTA where CACCESORIO = @caccesorio and CCONTRATOFLOTA = @ccontratoflota');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createInspectonsByFleetContractUpdateQuery: async(inspections, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < inspections.length; i++){
                let insert = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('cperito', sql.Int, inspections[i].cperito)
                    .input('ctipoinspeccion', sql.Int, inspections[i].ctipoinspeccion)
                    .input('finspeccion', sql.DateTime, inspections[i].finspeccion)
                    .input('xobservacion', sql.NVarChar, inspections[i].xobservacion)
                    .input('cusuariocreacion', sql.Int, fleetContractData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into SUINSPECCIONCONTRATOFLOTA (CCONTRATOFLOTA, CPERITO, CTIPOINSPECCION, FINSPECCION, XOBSERVACION, CUSUARIOCREACION, FCREACION) output inserted.CINSPECCIONCONTRATOFLOTA values (@ccontratoflota, @cperito, @ctipoinspeccion, @finspeccion, @xobservacion, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
                if(insert.rowsAffected > 0 && inspections[i].intervals){
                    for(let j = 0; j < inspections[i].images.length; j++){
                        let subInsert = await pool.request()
                            .input('cinspeccioncontratoflota', sql.Int, insert.recordset[0].CINSPECCIONCONTRATOFLOTA)
                            .input('xrutaimagen', sql.NVarChar, inspections[i].images[j].xrutaimagen)
                            .input('cusuariocreacion', sql.Int, fleetContractData.cusuariomodificacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into SUIMAGENINSPECCION (CINSPECCIONCONTRATOFLOTA, XRUTAIMAGEN, CUSUARIOCREACION, FCREACION) values (@cinspeccioncontratoflota, @xrutaimagen, @cusuariocreacion, @fcreacion)')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateInspectionsByFleetContractUpdateQuery: async(inspections, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < inspections.length; i++){
                let update = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                    .input('cperito', sql.Int, inspections[i].cperito)
                    .input('ctipoinspeccion', sql.Int, inspections[i].ctipoinspeccion)
                    .input('finspeccion', sql.DateTime, inspections[i].finspeccion)
                    .input('xobservacion', sql.NVarChar, inspections[i].xobservacion)
                    .input('cusuariomodificacion', sql.Int, fleetContractData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update SUINSPECCIONCONTRATOFLOTA set CPERITO = @cperito, CTIPOINSPECCION = @ctipoinspeccion, FINSPECCION = @finspeccion, XOBSERVACION = @xobservacion, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONTRATOFLOTA = @ccontratoflota and CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota');
                rowsAffected = rowsAffected + update.rowsAffected;
                if(inspections[i].imagesResult){
                    if(update.rowsAffected > 0 && inspections[i].imagesResult.create){
                        for(let j = 0; j < inspections[i].imagesResult.create.length; j++){
                            let subInsert = await pool.request()
                                .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                                .input('xrutaimagen', sql.NVarChar, inspections[i].imagesResult.create[j].xrutaimagen)
                                .input('cusuariocreacion', sql.Int, fleetContractData.cusuariomodificacion)
                                .input('fcreacion', sql.DateTime, new Date())
                                .query('insert into SUIMAGENINSPECCION (CINSPECCIONCONTRATOFLOTA, XRUTAIMAGEN, CUSUARIOCREACION, FCREACION) values (@cinspeccioncontratoflota, @xrutaimagen, @cusuariocreacion, @fcreacion)')
                        }
                    }
                    if(update.rowsAffected > 0 && inspections[i].imagesResult.update){
                        for(let j = 0; j < inspections[i].imagesResult.update.length; j++){
                            let subUpdate = await pool.request()
                                .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                                .input('cimageninspeccion', sql.Int, inspections[i].imagesResult.update[j].cimageninspeccion)
                                .input('xrutaimagen', sql.NVarChar, inspections[i].imagesResult.update[j].xrutaimagen)
                                .input('cusuariomodificacion', sql.Int, fleetContractData.cusuariomodificacion)
                                .input('fmodificacion', sql.DateTime, new Date())
                                .query('update SUIMAGENINSPECCION set XRUTAIMAGEN = @xrutaimagen, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota and CIMAGENINSPECCION = @cimageninspeccion')
                        }
                    }
                    if(update.rowsAffected > 0 && inspections[i].imagesResult.delete){
                        for(let j = 0; j < inspections[i].imagesResult.delete.length; j++){
                            let subDelete = await pool.request()
                                .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                                .input('cimageninspeccion', sql.Int, inspections[i].imagesResult.delete[j].cimageninspeccion)
                                .query('delete from SUIMAGENINSPECCION where CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota and CIMAGENINSPECCION = @cimageninspeccion')
                        }
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteInspectionsByFleetContractUpdateQuery: async(inspections, fleetContractData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < inspections.length; i++){
                let suberase = await pool.request()
                    .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                    .query('delete from SUIMAGENINSPECCION where CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota');
                let erase = await pool.request()
                    .input('ccontratoflota', sql.Int, fleetContractData.ccontratoflota)
                    .input('cinspeccioncontratoflota', sql.Int, inspections[i].cinspeccioncontratoflota)
                    .query('delete from SUINSPECCIONCONTRATOFLOTA where CCONTRATOFLOTA = @ccontratoflota and CINSPECCIONCONTRATOFLOTA = @cinspeccioncontratoflota');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getFleetMaxId: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select max(ID) as maxID from TMEMISION_SERVICIOS')
            return result.recordset[0].maxID
        }
        catch(err){
            return { error: err.message };
        }
    },
    createChargeQuery: async(chargeList) => {
        try{
            if(chargeList.length > 0){
                let rowsAffected = 0;
                let pool = await sql.connect(config);
                for(let i = 0; i < chargeList.length; i++){
                    let fnac;
                    if (chargeList[i].FNAC) {
                        let fnac = new Date(changeDateFormat(chargeList[i].FNAC));
                    }
                    let femision = new Date(changeDateFormat(chargeList[i].FEMISION));
                    let fdesde_pol = new Date(changeDateFormat(chargeList[i].FDESDE_POL));
                    let fhasta_pol = new Date(changeDateFormat(chargeList[i].FHASTA_POL));
                    let insert = await pool.request()
                        .input('xpoliza', sql.NVarChar, chargeList[i].XPOLIZA)
                        .input('xnombre', sql.NVarChar, chargeList[i].XNOMBRE)
                        .input('xapellido', sql.NVarChar, chargeList[i].XAPELLIDO)
                        .input('icedula', sql.NVarChar, chargeList[i].ICEDULA)
                        .input('xcedula', sql.NVarChar, chargeList[i].XCEDULA)
                        .input('fnac', sql.DateTime, fnac ? fnac : undefined)
                        .input('cplan', sql.Int, chargeList[i].CPLAN)
                        .input('cplan_rc', sql.Int, chargeList[i].CPLAN_RC)
                        .input('xserialcarroceria', sql.NVarChar, chargeList[i].XSERIALCARROCERIA)
                        .input('xserialmotor', sql.NVarChar, chargeList[i].XSERIALMOTOR)
                        .input('xplaca', sql.NVarChar, chargeList[i].XPLACA)
                        .input('xmarca', sql.NVarChar, chargeList[i].XMARCA)
                        .input('xmodelo', sql.NVarChar, chargeList[i].XMODELO)
                        .input('xversion', sql.NVarChar, chargeList[i].XVERSION)
                        .input('cano', sql.Int, chargeList[i].CANO)
                        .input('xcolor', sql.NVarChar, chargeList[i].XCOLOR)
                        .input('xdireccionfiscal', sql.NVarChar, chargeList[i].XDIRECCIONFISCAL)
                        .input('xtelefono_emp', sql.NVarChar, chargeList[i].XTELEFONO_EMP)
                        .input('xtelefono_prop', sql.NVarChar, chargeList[i].XTELEFONO_PROP ? chargeList[i].XTELEFONO_PROP : undefined)
                        .input('email', sql.NVarChar, chargeList[i].EMAIL)
                        .input('femision', sql.DateTime, femision.toISOString())
                        .input('fdesde_pol', sql.DateTime, fdesde_pol.toISOString())
                        .input('fhasta_pol', sql.DateTime, fhasta_pol.toISOString())
                        .input('xprovincia', sql.NVarChar, chargeList[i].XPROVINCIA)
                        .input('xdistrito', sql.NVarChar, chargeList[i].XDISTRITO ? chargeList[i].XDISTRITO : undefined)
                        .input('xcorregimiento', sql.NVarChar, chargeList[i].XCORREGIMIENTO ? chargeList[i].XCORREGIMIENTO : undefined)
                        .input('mprima', sql.Numeric, chargeList[i].PRIMA)
                        .input('xcanal_venta', sql.NVarChar, chargeList[i].XCANAL_VENTA)
                        .query('insert into TMEMISION (XPOLIZA, XNOMBRE, XAPELLIDO, ICEDULA, XCEDULA, FNAC, CPLAN, CPLAN_RC, XSERIALCARROCERIA, XSERIALMOTOR, XPLACA, XMARCA, XMODELO, XVERSION, CANO, XCOLOR, XDIRECCIONFISCAL, XTELEFONO_EMP, XTELEFONO_PROP, EMAIL, FEMISION, FDESDE_POL, FHASTA_POL, XPROVINCIA, XDISTRITO, XCORREGIMIENTO, MPRIMA, XCANAL_VENTA)'
                                             + 'values (@xpoliza, @xnombre, @xapellido, @icedula, @xcedula, @fnac, @cplan, @cplan_rc, @xserialcarroceria, @xserialmotor, @xplaca, @xmarca, @xmodelo, @xversion, @cano, @xcolor, @xdireccionfiscal, @xtelefono_emp, @xtelefono_prop, @email, @femision, @fdesde_pol, @fhasta_pol, @xprovincia, @xdistrito, @Xcorregimiento, @mprima, @xcanal_venta)')
                        rowsAffected = rowsAffected + insert.rowsAffected;
                }
                return { result: {rowsAffected: rowsAffected} };
            }else{
                return { result: result };
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    deleteChargeQuery: async () => {
        try {
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('DELETE FROM TMEMISION')
            return true
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    createParentPolicyQuery: async(parentPolicyData, cpais, ccompania, cusuario, cpoliza) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let insert = await pool.request()
                .input('XDESCRIPCION_L', sql.NVarChar, parentPolicyData.xdescripcion_l)
                .input('XPOLIZA', sql.NVarChar, '0000' + cpoliza)
                .input('CCLIENTE', sql.Int, parentPolicyData.ccliente)
                .input('CCORREDOR', sql.Int, parentPolicyData.ccorredor)
                .input('CPAIS', sql.Int, cpais)
                .input('CCOMPANIA', sql.Int, ccompania)
                .input('FINGRESO', sql.DateTime, new Date())
                .input('IESTADO', sql.Int, 1)
                .input('BACTIVO', sql.Int, 1)
                .input('FCREACION', sql.DateTime, new Date())
                .input('CUSUARIOCREACION', sql.Int, cusuario)
                .input('FMODIFICACION', sql.DateTime, new Date())
                .input('CUSUARIOMODIFICACION', sql.Int, cusuario)
                .input('ITIPOCLIENTE', sql.NVarChar, 'C')
                .query('INSERT INTO SUPOLIZAMATRIZ (XDESCRIPCION_L, XPOLIZA, CCLIENTE, CCORREDOR, CPAIS, CCOMPANIA, FINGRESO, IESTADO, BACTIVO, FCREACION, CUSUARIOCREACION, FMODIFICACION, CUSUARIOMODIFICACION, ITIPOCLIENTE) OUTPUT INSERTED.CCARGA VALUES (@XDESCRIPCION_L, @XPOLIZA, @CCLIENTE, @CCORREDOR, @CPAIS, @CCOMPANIA, @FINGRESO, @IESTADO, @BACTIVO, @FCREACION, @CUSUARIOCREACION, @FMODIFICACION, @CUSUARIOMODIFICACION, @ITIPOCLIENTE)')
            rowsAffected = rowsAffected + parseInt(insert.rowsAffected);
            //sql.close();
            return { result: { rowsAffected: rowsAffected, ccarga: insert.recordset[0].CCARGA } };
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    getLastPolicyNumberQuery: async(ccarga) => {
        try{
            let pool = await sql.connect(config);
            let query = await pool.request()
                .query('SELECT CPOLIZA FROM MACONTADORES')
            let cpoliza = 0
            if (query.recordset.length > 0) {
                cpoliza = query.recordset[0].CPOLIZA
            }
            query = await pool.request()
                .input('CPOLIZA', sql.Int, cpoliza + 1)
                .query('UPDATE MACONTADORES SET CPOLIZA = @CPOLIZA')
            return { result: {cpoliza: cpoliza + 1}}
        }
        catch(err) {
;
            return { error: err.message };
        }
    },
    getLastParentPolicyBatchQuery: async(ccarga) => {
        try{
            let pool = await sql.connect(config);
            let query = await pool.request()
                .input('CCARGA', sql.Int, ccarga)
                .query('SELECT CLOTE FROM SUPOLIZALOTE WHERE CCARGA = @CCARGA ORDER BY CLOTE DESC')
            let clote = 0
            if (query.recordset.length > 0) {
                clote = query.recordset[0].CLOTE
            }
            return { result: {clote: clote}}
        }
        catch(err) {
;
            return { error: err.message };
        }
    },
    createBatchQuery: async(ccarga, cusuario, xobservacion, lastBatchCode) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let insert = await pool.request()
                .input('CCARGA', sql.Int, ccarga)
                .input('CLOTE', sql.Int, lastBatchCode + 1)
                .input('XOBSERVACION', sql.NVarChar, xobservacion)
                .input('CUSUARIOCREACION', sql.Int, cusuario)
                .input('FCREACION', sql.DateTime, new Date())
                .input('FMODIFICACION', sql.DateTime, new Date())
                .input('CUSUARIOMODIFICACION', sql.Int, cusuario)
                .query('INSERT INTO SUPOLIZALOTE (CCARGA, CLOTE, XOBSERVACION, BACTIVO, FCREACION, CUSUARIOCREACION, FMODIFICACION, CUSUARIOMODIFICACION) OUTPUT INSERTED.CLOTE VALUES (@CCARGA, @CLOTE, @XOBSERVACION, 1, @FCREACION, @CUSUARIOCREACION, @FMODIFICACION, @CUSUARIOMODIFICACION)')
            rowsAffected = rowsAffected + parseInt(insert.rowsAffected);
            //sql.close();
            return { result: { rowsAffected: rowsAffected, clote: insert.recordset[0].CLOTE } };
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    createBatchContractQuery: async(contractList, ccarga, clote, ccliente, xpoliza) => {
        try{
            if(contractList){
                let rowsAffected = 0;
                let pool = await sql.connect(config);
                for(let i = 0; i < contractList.length; i++){
                    if (contractList[i].ID){
                        if (contractList[i].TARIFA) {
                            contractList[i].TARIFA = contractList[i].TARIFA.replace("%", "")
                            if (isNaN(contractList[i].TARIFA)) {
                                contractList[i].TARIFA = 0;
                            }
                        }
                        if (contractList[i].FECHA_NAC){
                            contractList[i].FECHA_NAC = changeDateFormat(contractList[i].FECHA_NAC);
                        }
                        else {contractList[i].TARIFA = 0}
                        contractList[i].FECHA_EMISION = new Date(changeDateFormat(contractList[i].FECHA_EMISION));
                        contractList[i].FDESDE_POL = new Date(changeDateFormat(contractList[i].FDESDE_POL));
                        contractList[i].FHASTA_POL = new Date(changeDateFormat(contractList[i].FHASTA_POL));
                        contractList[i].FDESDE_REC = new Date(changeDateFormat(contractList[i].FDESDE_REC));
                        contractList[i].FHASTA_REC = new Date(changeDateFormat(contractList[i].FHASTA_REC));
                        let insert = await pool.request()
                            .input('ID', sql.Int, contractList[i].ID)
                            .input('CCLIENTE', sql.Int, ccliente)
                            .input('CCARGA', sql.Int, ccarga)
                            .input('CLOTE', sql.Int, clote)
                            .input('XCLIENTE', sql.NVarChar, contractList[i].XCLIENTE)
                            .input('XRIF_CLIENTE', sql.NVarChar, contractList[i].RIF_EMPRESA)
                            .input('XNOMBRE', sql.NVarChar, contractList[i].NOMBRE)
                            .input('XAPELLIDO', sql.NVarChar, contractList[i].APELLIDO)
                            .input('XCEDULA', sql.NVarChar, contractList[i].CEDULA)
                            .input('FNAC', sql.DateTime, contractList[i].FECHA_NAC ? contractList[i].FECHA_NAC : undefined)
                            .input('XDIRECCIONFISCAL', sql.NVarChar, contractList[i].XDIRECCION)
                            .input('XTELEFONO_EMP', sql.NVarChar, contractList[i].XTELEFONO_EMP)
                            .input('XTELEFONO_PROP', sql.NVarChar, contractList[i].XTELEFONO_PROP)
                            .input('CPLAN', sql.Int, contractList[i].PLAN)
                            .input('XSERIALCARROCERIA', sql.NVarChar, contractList[i]["SERIAL CARROCERIA"])
                            .input('XSERIALMOTOR', sql.NVarChar, contractList[i]["SERIAL MOTOR"])
                            .input('XPLACA', sql.NVarChar, contractList[i].PLACA)
                            .input('CMARCA', sql.Int, contractList[i].CMARCA)
                            .input('XMARCA', sql.NVarChar, contractList[i].MARCA)
                            .input('CMODELO', sql.Int, contractList[i].CMODELO)
                            .input('XMODELO', sql.NVarChar, contractList[i].MODELO)
                            .input('CVERSION', sql.Int, contractList[i].CVERSION)
                            .input('XVERSION', sql.NVarChar, contractList[i].VERSION)
                            .input('CANO', sql.Int, contractList[i].CANO)
                            .input('XCOLOR', sql.NVarChar, contractList[i].XCOLOR)
                            .input('XTIPO', sql.NVarChar, contractList[i].XTIPO)
                            .input('XCOBERTURA', sql.NVarChar, contractList[i].XCOBERTURA)
                            .input('MSUMA_ASEG', sql.Numeric(11, 2), contractList[i].SUMA_ASEGURADA)
                            .input('MTARIFA', sql.Numeric(11, 2), contractList[i].TARIFA)
                            .input('MPRIMA_CASCO', sql.Numeric(11, 2), contractList[i].PRIMA_CASCO)
                            .input('MSUMA_ACCESORIOS', sql.Numeric(11, 2), contractList[i].SA_ACCESORIOS)
                            .input('MPRIMA_ACCESORIOS', sql.Numeric(11, 2), contractList[i].PRIMA_ACCESORIOS)
                            .input('MSUMA_BLINDAJE', sql.Numeric(11, 2), contractList[i].SA_BLINDAJE)
                            .input('MPRIMA_BLINDAJE', sql.Numeric(11, 2), contractList[i].PRIMA_BLINDAJE)
                            .input('MCATASTROFICO', sql.Numeric(11, 2), contractList[i].MCATASTROFICO)
                            .input('EMAIL', sql.NVarChar, contractList[i].EMAIL ? contractList[i].EMAIL : undefined)
                            .input('FEMISION', sql.DateTime, contractList[i].FECHA_EMISION.toISOString())
                            .input('FDESDE_POL', sql.DateTime, contractList[i].FDESDE_POL.toISOString())
                            .input('FHASTA_POL', sql.DateTime, contractList[i].FHASTA_POL.toISOString())
                            .input('FDESDE_REC', sql.DateTime, contractList[i].FDESDE_REC.toISOString())
                            .input('FHASTA_REC', sql.DateTime, contractList[i].FHASTA_REC.toISOString())
                            .input('NCAPACIDAD_P', sql.Int, contractList[i].CAPACIDAD_PAS)
                            .input('MCAPACIDAD_C', sql.Numeric(11, 2), contractList[i].CAPACIDAD_CARGA ? contractList[i].CAPACIDAD_CARGA: undefined)
                            .input('XUSO', sql.NVarChar, contractList[i].USO)
                            .input('CCORREDOR', sql.Int, contractList[i].CORREDOR)
                            .input('xpoliza', sql.NVarChar, xpoliza)
                            .query('INSERT INTO TMEMISION_FLOTA (ID, CCLIENTE, CCARGA, CLOTE, XCLIENTE, XRIF_CLIENTE, XNOMBRE, XAPELLIDO, XCEDULA, CPLAN, XSERIALCARROCERIA, XSERIALMOTOR, XPLACA, CMARCA, XMARCA, CMODELO, XMODELO, CVERSION, XVERSION, CANO, XCOLOR, XTIPO, XCOBERTURA, MSUMA_ASEG, MTARIFA, MPRIMA_CASCO, MSUMA_ACCESORIOS, MPRIMA_ACCESORIOS, MSUMA_BLINDAJE, MPRIMA_BLINDAJE, MCATASTROFICO, FNAC, XDIRECCIONFISCAL, XTELEFONO_EMP, XTELEFONO_PROP, EMAIL, FEMISION, FDESDE_POL, FHASTA_POL, FDESDE_REC, FHASTA_REC, NCAPACIDAD_P, MCAPACIDAD_C, XUSO, CCORREDOR, XPOLIZA) VALUES (@ID, @CCLIENTE, @CCARGA, @CLOTE, @XCLIENTE, @XRIF_CLIENTE, @XNOMBRE, @XAPELLIDO, @XCEDULA, @CPLAN, @XSERIALCARROCERIA, @XSERIALMOTOR, @XPLACA, @CMARCA, @XMARCA, @CMODELO, @XMODELO, @CVERSION, @XVERSION, @CANO, @XCOLOR, @XTIPO, @XCOBERTURA, @MSUMA_ASEG, @MTARIFA, @MPRIMA_CASCO, @MSUMA_ACCESORIOS, @MPRIMA_ACCESORIOS, @MSUMA_BLINDAJE, @MPRIMA_BLINDAJE, @MCATASTROFICO, @FNAC, @XDIRECCIONFISCAL, @XTELEFONO_EMP, @XTELEFONO_PROP, @EMAIL, @FEMISION, @FDESDE_POL, @FHASTA_POL, @FDESDE_REC, @FHASTA_REC, @NCAPACIDAD_P, @MCAPACIDAD_C, @XUSO, @CCORREDOR, @XPOLIZA )')
                            rowsAffected = rowsAffected + insert.rowsAffected;
                    }
                }
                return { result: { rowsAffected: rowsAffected} };
            }else{
                return { result: result };
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    deleteBatchByParentPolicyQuery: async(ccarga, clote) => {
        try{
            let pool = await sql.connect(config);
            let erase = await pool.request()
                .input('CCARGA', sql.Int, ccarga)
                .input('CLOTE', sql.Int, clote)
                .query('DELETE FROM SUPOLIZALOTE where CCARGA = @CCARGA AND CLOTE = @CLOTE');
            //sql.close();
            return { result: erase };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchClaimCauseQuery: async(searchData) => {
        try{
            let query = `select * from MACAUSASINIESTRO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xcausasiniestro ? " and XCAUSASINIESTRO like '%" + searchData.xcausasiniestro + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyClaimCauseNameToCreateQuery: async(claimCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                .input('ccompania', sql.Int, claimCauseData.ccompania)
                .input('xcausasiniestro', sql.NVarChar, claimCauseData.xcausasiniestro)
                .query('select * from MACAUSASINIESTRO where XCAUSASINIESTRO = @xcausasiniestro and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createClaimCauseQuery: async(claimCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xcausasiniestro', sql.NVarChar, claimCauseData.xcausasiniestro)
                .input('bactivo', sql.Bit, claimCauseData.bactivo)
                .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                .input('ccompania', sql.Int, claimCauseData.ccompania)
                .input('cusuariocreacion', sql.Int, claimCauseData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MACAUSASINIESTRO (XCAUSASINIESTRO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xcausasiniestro, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xcausasiniestro', sql.NVarChar, claimCauseData.xcausasiniestro)
                    .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                    .input('ccompania', sql.Int, claimCauseData.ccompania)
                    .query('select * from MACAUSASINIESTRO where XCAUSASINIESTRO = @xcausasiniestro and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getClaimCauseDataQuery: async(claimCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                .input('ccompania', sql.Int, claimCauseData.ccompania)
                .input('ccausasiniestro', sql.Int, claimCauseData.ccausasiniestro)
                .query('select * from MACAUSASINIESTRO where CPAIS = @cpais and CCAUSASINIESTRO = @ccausasiniestro and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyClaimCauseNameToUpdateQuery: async(claimCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                .input('ccompania', sql.Int, claimCauseData.ccompania)
                .input('xcausasiniestro', sql.NVarChar, claimCauseData.xcausasiniestro)
                .input('ccausasiniestro', sql.Int, claimCauseData.ccausasiniestro)
                .query('select * from MACAUSASINIESTRO where XCAUSASINIESTRO = @xcausasiniestro and CCAUSASINIESTRO != @ccausasiniestro and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateClaimCauseQuery: async(claimCauseData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), claimCauseData.cpais)
                .input('ccompania', sql.Int, claimCauseData.ccompania)
                .input('ccausasiniestro', sql.Int, claimCauseData.ccausasiniestro)
                .input('xcausasiniestro', sql.NVarChar, claimCauseData.xcausasiniestro)
                .input('bactivo', sql.Bit, claimCauseData.bactivo)
                .input('cusuariomodificacion', sql.Int, claimCauseData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MACAUSASINIESTRO set XCAUSASINIESTRO = @xcausasiniestro, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCAUSASINIESTRO = @ccausasiniestro and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDamageLevelQuery: async(searchData) => {
        try{
            let query = `select * from MANIVELDANO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xniveldano ? " and XNIVELDANO like '%" + searchData.xniveldano + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDamageLevelNameToCreateQuery: async(damageLevelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                .input('ccompania', sql.Int, damageLevelData.ccompania)
                .input('xniveldano', sql.NVarChar, damageLevelData.xniveldano)
                .query('select * from MANIVELDANO where XNIVELDANO = @xniveldano and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createDamageLevelQuery: async(damageLevelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xniveldano', sql.NVarChar, damageLevelData.xniveldano)
                .input('bactivo', sql.Bit, damageLevelData.bactivo)
                .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                .input('ccompania', sql.Int, damageLevelData.ccompania)
                .input('cusuariocreacion', sql.Int, damageLevelData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MANIVELDANO (XNIVELDANO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xniveldano, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xniveldano', sql.NVarChar, damageLevelData.xniveldano)
                    .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                    .input('ccompania', sql.Int, damageLevelData.ccompania)
                    .query('select * from MANIVELDANO where XNIVELDANO = @xniveldano and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getDamageLevelDataQuery: async(damageLevelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                .input('ccompania', sql.Int, damageLevelData.ccompania)
                .input('cniveldano', sql.Int, damageLevelData.cniveldano)
                .query('select * from MANIVELDANO where CPAIS = @cpais and CNIVELDANO = @cniveldano and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyDamageLevelNameToUpdateQuery: async(damageLevelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                .input('ccompania', sql.Int, damageLevelData.ccompania)
                .input('xniveldano', sql.NVarChar, damageLevelData.xniveldano)
                .input('cniveldano', sql.Int, damageLevelData.cniveldano)
                .query('select * from MANIVELDANO where XNIVELDANO = @xniveldano and CNIVELDANO != @cniveldano and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateDamageLevelQuery: async(damageLevelData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), damageLevelData.cpais)
                .input('ccompania', sql.Int, damageLevelData.ccompania)
                .input('cniveldano', sql.Int, damageLevelData.cniveldano)
                .input('xniveldano', sql.NVarChar, damageLevelData.xniveldano)
                .input('bactivo', sql.Bit, damageLevelData.bactivo)
                .input('cusuariomodificacion', sql.Int, damageLevelData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MANIVELDANO set XNIVELDANO = @xniveldano, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CNIVELDANO = @cniveldano and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchMaterialDamageQuery: async(searchData) => {
        try{
            let query = `select * from MADANOMATERIAL where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xdanomaterial ? " and XDANOMATERIAL like '%" + searchData.xdanomaterial + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyMaterialDamageNameToCreateQuery: async(materialDamageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                .input('ccompania', sql.Int, materialDamageData.ccompania)
                .input('xdanomaterial', sql.NVarChar, materialDamageData.xdanomaterial)
                .query('select * from MADANOMATERIAL where XDANOMATERIAL = @xdanomaterial and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createMaterialDamageQuery: async(materialDamageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xdanomaterial', sql.NVarChar, materialDamageData.xdanomaterial)
                .input('bactivo', sql.Bit, materialDamageData.bactivo)
                .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                .input('ccompania', sql.Int, materialDamageData.ccompania)
                .input('cusuariocreacion', sql.Int, materialDamageData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MADANOMATERIAL (XDANOMATERIAL, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xdanomaterial, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xdanomaterial', sql.NVarChar, materialDamageData.xdanomaterial)
                    .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                    .input('ccompania', sql.Int, materialDamageData.ccompania)
                    .query('select * from MADANOMATERIAL where XDANOMATERIAL = @xdanomaterial and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getMaterialDamageDataQuery: async(materialDamageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                .input('ccompania', sql.Int, materialDamageData.ccompania)
                .input('cdanomaterial', sql.Int, materialDamageData.cdanomaterial)
                .query('select * from MADANOMATERIAL where CPAIS = @cpais and CDANOMATERIAL = @cdanomaterial and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyMaterialDamageNameToUpdateQuery: async(materialDamageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                .input('ccompania', sql.Int, materialDamageData.ccompania)
                .input('xdanomaterial', sql.NVarChar, materialDamageData.xdanomaterial)
                .input('cdanomaterial', sql.Int, materialDamageData.cdanomaterial)
                .query('select * from MADANOMATERIAL where XDANOMATERIAL = @xdanomaterial and CDANOMATERIAL != @cdanomaterial and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateMaterialDamageQuery: async(materialDamageData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), materialDamageData.cpais)
                .input('ccompania', sql.Int, materialDamageData.ccompania)
                .input('cdanomaterial', sql.Int, materialDamageData.cdanomaterial)
                .input('xdanomaterial', sql.NVarChar, materialDamageData.xdanomaterial)
                .input('bactivo', sql.Bit, materialDamageData.bactivo)
                .input('cusuariomodificacion', sql.Int, materialDamageData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MADANOMATERIAL set XDANOMATERIAL = @xdanomaterial, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDANOMATERIAL = @cdanomaterial and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchNotificationQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARNOTIFICACIONDATA where CCOMPANIA = @ccompania${ searchData.cnotificacion ? " and CNOTIFICACION = @cnotificacion" : '' }${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }${ searchData.casociado ? " and CASOCIADO = @casociado" : '' }${ searchData.fevento ? " and datediff(day, FEVENTO, @fevento) = 0" : '' }${ searchData.fcreacion ? " and datediff(day, FCREACION, @fcreacion) = 0" : '' }${ searchData.xplaca ? " and XPLACA = @xplaca" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cnotificacion', sql.Int, searchData.cnotificacion ? searchData.cnotificacion : 1)
                .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente : 1)
                .input('casociado', sql.Int, searchData.casociado ? searchData.casociado : 1)
                .input('fevento', sql.DateTime, searchData.fevento ? searchData.fevento : '01/01/2000')
                .input('fcreacion', sql.DateTime, searchData.fcreacion ? searchData.fcreacion : '01/01/2000')
                .input('xplaca', sql.NVarChar, searchData.xplaca ? searchData.xplaca: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    notificationTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPONOTIFICACION, XTIPONOTIFICACION, BACTIVO from MATIPONOTIFICACION where CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    claimCauseValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCAUSASINIESTRO, XCAUSASINIESTRO, BACTIVO from MACAUSASINIESTRO where CCOMPANIA = ccompania AND CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    materialDamageValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CDANOMATERIAL, XDANOMATERIAL, BACTIVO from MADANOMATERIAL where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    damageLevelValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CNIVELDANO, XNIVELDANO, BACTIVO from MANIVELDANO where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    replacementValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ctiporepuesto', sql.Int, searchData.ctiporepuesto)
                .query('select CTIPOREPUESTO, CREPUESTO, XREPUESTO, BACTIVO from MAREPUESTO where CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOREPUESTO = @ctiporepuesto');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchTracingTypeQuery: async(searchData) => {
        try{
            let query = `select * from MATIPOSEGUIMIENTO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xtiposeguimiento ? " and XTIPOSEGUIMIENTO like '%" + searchData.xtiposeguimiento + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTracingTypeNameToCreateQuery: async(tracingTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                .input('ccompania', sql.Int, tracingTypeData.ccompania)
                .input('xtiposeguimiento', sql.NVarChar, tracingTypeData.xtiposeguimiento)
                .query('select * from MATIPOSEGUIMIENTO where XTIPOSEGUIMIENTO = @xtiposeguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createTracingTypeQuery: async(tracingTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xtiposeguimiento', sql.NVarChar, tracingTypeData.xtiposeguimiento)
                .input('bactivo', sql.Bit, tracingTypeData.bactivo)
                .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                .input('ccompania', sql.Int, tracingTypeData.ccompania)
                .input('cusuariocreacion', sql.Int, tracingTypeData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MATIPOSEGUIMIENTO (XTIPOSEGUIMIENTO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xtiposeguimiento, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xtiposeguimiento', sql.NVarChar, tracingTypeData.xtiposeguimiento)
                    .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                    .input('ccompania', sql.Int, tracingTypeData.ccompania)
                    .query('select * from MATIPOSEGUIMIENTO where XTIPOSEGUIMIENTO = @xtiposeguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getTracingTypeDataQuery: async(tracingTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                .input('ccompania', sql.Int, tracingTypeData.ccompania)
                .input('ctiposeguimiento', sql.Int, tracingTypeData.ctiposeguimiento)
                .query('select * from MATIPOSEGUIMIENTO where CPAIS = @cpais and CTIPOSEGUIMIENTO = @ctiposeguimiento and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTracingTypeNameToUpdateQuery: async(tracingTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                .input('ccompania', sql.Int, tracingTypeData.ccompania)
                .input('xtiposeguimiento', sql.NVarChar, tracingTypeData.xtiposeguimiento)
                .input('ctiposeguimiento', sql.Int, tracingTypeData.ctiposeguimiento)
                .query('select * from MATIPOSEGUIMIENTO where XTIPOSEGUIMIENTO = @xtiposeguimiento and CTIPOSEGUIMIENTO != @ctiposeguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateTracingTypeQuery: async(tracingTypeData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingTypeData.cpais)
                .input('ccompania', sql.Int, tracingTypeData.ccompania)
                .input('ctiposeguimiento', sql.Int, tracingTypeData.ctiposeguimiento)
                .input('xtiposeguimiento', sql.NVarChar, tracingTypeData.xtiposeguimiento)
                .input('bactivo', sql.Bit, tracingTypeData.bactivo)
                .input('cusuariomodificacion', sql.Int, tracingTypeData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MATIPOSEGUIMIENTO set XTIPOSEGUIMIENTO = @xtiposeguimiento, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPOSEGUIMIENTO = @ctiposeguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchTracingMotiveQuery: async(searchData) => {
        try{
            let query = `select * from MAMOTIVOSEGUIMIENTO where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xmotivoseguimiento ? " and XMOTIVOSEGUIMIENTO like '%" + searchData.xmotivoseguimiento + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTracingMotiveNameToCreateQuery: async(tracingMotiveData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                .input('xmotivoseguimiento', sql.NVarChar, tracingMotiveData.xmotivoseguimiento)
                .query('select * from MAMOTIVOSEGUIMIENTO where XMOTIVOSEGUIMIENTO = @xmotivoseguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createTracingMotiveQuery: async(tracingMotiveData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xmotivoseguimiento', sql.NVarChar, tracingMotiveData.xmotivoseguimiento)
                .input('bactivo', sql.Bit, tracingMotiveData.bactivo)
                .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                .input('cusuariocreacion', sql.Int, tracingMotiveData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MAMOTIVOSEGUIMIENTO (XMOTIVOSEGUIMIENTO, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xmotivoseguimiento, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xmotivoseguimiento', sql.NVarChar, tracingMotiveData.xmotivoseguimiento)
                    .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                    .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                    .query('select * from MAMOTIVOSEGUIMIENTO where XMOTIVOSEGUIMIENTO = @xmotivoseguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getTracingMotiveDataQuery: async(tracingMotiveData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                .input('cmotivoseguimiento', sql.Int, tracingMotiveData.cmotivoseguimiento)
                .query('select * from MAMOTIVOSEGUIMIENTO where CPAIS = @cpais and CMOTIVOSEGUIMIENTO = @cmotivoseguimiento and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyTracingMotiveNameToUpdateQuery: async(tracingMotiveData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                .input('xmotivoseguimiento', sql.NVarChar, tracingMotiveData.xmotivoseguimiento)
                .input('cmotivoseguimiento', sql.Int, tracingMotiveData.cmotivoseguimiento)
                .query('select * from MAMOTIVOSEGUIMIENTO where XMOTIVOSEGUIMIENTO = @xmotivoseguimiento and CMOTIVOSEGUIMIENTO != @cmotivoseguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateTracingMotiveQuery: async(tracingMotiveData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), tracingMotiveData.cpais)
                .input('ccompania', sql.Int, tracingMotiveData.ccompania)
                .input('cmotivoseguimiento', sql.Int, tracingMotiveData.cmotivoseguimiento)
                .input('xmotivoseguimiento', sql.NVarChar, tracingMotiveData.xmotivoseguimiento)
                .input('bactivo', sql.Bit, tracingMotiveData.bactivo)
                .input('cusuariomodificacion', sql.Int, tracingMotiveData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update MAMOTIVOSEGUIMIENTO set XMOTIVOSEGUIMIENTO = @xmotivoseguimiento, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CMOTIVOSEGUIMIENTO = @cmotivoseguimiento and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    tracingTypeValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CTIPOSEGUIMIENTO, XTIPOSEGUIMIENTO, BACTIVO from MATIPOSEGUIMIENTO where CCOMPANIA = @ccompania AND CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    tracingMotiveValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CMOTIVOSEGUIMIENTO, XMOTIVOSEGUIMIENTO, BACTIVO from MAMOTIVOSEGUIMIENTO where CCOMPANIA = @ccompania AND CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createNotificationQuery: async(notificationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), notificationData.cpais)
                .input('ccompania', sql.Int, notificationData.ccompania)
                .input('ccontratoflota', sql.Int, notificationData.ccontratoflota)
                .input('ctiponotificacion', sql.Int, notificationData.ctiponotificacion)
                .input('crecaudo', sql.Int, notificationData.crecaudo)
                .input('ccausasiniestro', sql.Int, notificationData.ccausasiniestro)
                .input('xnombre', sql.NVarChar, notificationData.xnombre)
                .input('xapellido', sql.NVarChar, notificationData.xapellido)
                .input('xtelefono', sql.NVarChar, notificationData.xtelefono)
                .input('xnombrealternativo', sql.NVarChar, notificationData.xnombrealternativo ? notificationData.xnombrealternativo : null)
                .input('xapellidoalternativo', sql.NVarChar, notificationData.xapellidoalternativo ? notificationData.xapellidoalternativo : null)
                .input('xtelefonoalternativo', sql.NVarChar, notificationData.xtelefonoalternativo ? notificationData.xtelefonoalternativo : null)
                .input('bdano', sql.Bit, notificationData.bdano)
                .input('btransitar', sql.Bit, notificationData.btransitar)
                .input('bdanootro', sql.Bit, notificationData.bdanootro)
                .input('blesionado', sql.Bit, notificationData.blesionado)
                .input('bpropietario', sql.Bit, notificationData.bpropietario)
                .input('fevento', sql.DateTime, notificationData.fevento)
                .input('cestado', sql.Int, notificationData.cestado)
                .input('cciudad', sql.Int, notificationData.cciudad)
                .input('xdireccion', sql.NVarChar, notificationData.xdireccion)
                .input('xdescripcion', sql.NVarChar, notificationData.xdescripcion)
                .input('btransito', sql.Bit, notificationData.btransito)
                .input('bcarga', sql.Bit, notificationData.bcarga)
                .input('bpasajero', sql.Bit, notificationData.bpasajero)
                .input('npasajero', sql.Int, notificationData.npasajero ? notificationData.npasajero : null)
                .input('xobservacion', sql.NVarChar, notificationData.xobservacion)
                .input('bactivo', sql.Bit, notificationData.bactivo)
                .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into EVNOTIFICACION (CPAIS, CCOMPANIA, CCONTRATOFLOTA, CTIPONOTIFICACION, CRECAUDO, CCAUSASINIESTRO, XNOMBRE, XAPELLIDO, XTELEFONO, XNOMBREALTERNATIVO, XAPELLIDOALTERNATIVO, XTELEFONOALTERNATIVO, BDANO, BTRANSITAR, BDANOOTRO, BLESIONADO, BPROPIETARIO, FEVENTO, CESTADO, CCIUDAD, XDIRECCION, XDESCRIPCION, BTRANSITO, BCARGA, BPASAJERO, NPASAJERO, XOBSERVACION, BACTIVO, CUSUARIOCREACION, FCREACION) output inserted.CNOTIFICACION values (@cpais, @ccompania, @ccontratoflota, @ctiponotificacion, @crecaudo, @ccausasiniestro, @xnombre, @xapellido, @xtelefono, @xnombrealternativo, @xapellidoalternativo, @xtelefonoalternativo, @bdano, @btransitar, @bdanootro, @blesionado, @bpropietario, @fevento, @cestado, @cciudad, @xdireccion, @xdescripcion, @btransito, @bcarga, @bpasajero, @npasajero, @xobservacion, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let insertSecond = await pool.request()
                    .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                    .input('ctiposeguimiento', sql.Int, notificationData.ctiposeguimiento)
                    .input('cmotivoseguimiento', sql.Int, notificationData.cmotivoseguimiento)
                    .input('fseguimientonotificacion', sql.DateTime, notificationData.fseguimientonotificacion)
                    .input('xobservacion', sql.NVarChar, notificationData.xobservacionseguimiento)
                    .input('bcerrado', sql.Bit, false)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVSEGUIMIENTONOTIFICACION (CNOTIFICACION, CTIPOSEGUIMIENTO, CMOTIVOSEGUIMIENTO, FSEGUIMIENTONOTIFICACION, XOBSERVACION, BCERRADO, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @ctiposeguimiento, @cmotivoseguimiento, @fseguimientonotificacion, @xobservacion, @bcerrado, @cusuariocreacion, @fcreacion)')
                if(notificationData.thirdpartyVehicles){
                    for(let i = 0; i < notificationData.thirdpartyVehicles.length; i++){
                        let insert = await pool.request()
                            .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                            .input('ctipodocidentidadconductor', sql.Int, notificationData.thirdpartyVehicles[i].ctipodocidentidadconductor)
                            .input('xdocidentidadconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xdocidentidadconductor)
                            .input('xnombreconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xnombreconductor)
                            .input('xapellidoconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xapellidoconductor)
                            .input('xtelefonocelularconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xtelefonocelularconductor)
                            .input('xtelefonocasaconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xtelefonocasaconductor ? notificationData.thirdpartyVehicles[i].xtelefonocasaconductor : null)
                            .input('xemailconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xemailconductor)
                            .input('xobservacionconductor', sql.NVarChar, notificationData.thirdpartyVehicles[i].xobservacionconductor)
                            .input('xplaca', sql.NVarChar, notificationData.thirdpartyVehicles[i].xplaca)
                            .input('cmarca', sql.Int, notificationData.thirdpartyVehicles[i].cmarca)
                            .input('cmodelo', sql.Int, notificationData.thirdpartyVehicles[i].cmodelo)
                            .input('cversion', sql.Int, notificationData.thirdpartyVehicles[i].cversion)
                            .input('fano', sql.Numeric(4, 0), notificationData.thirdpartyVehicles[i].fano)
                            .input('ccolor', sql.Int, notificationData.thirdpartyVehicles[i].ccolor)
                            .input('xobservacionvehiculo', sql.NVarChar, notificationData.thirdpartyVehicles[i].xobservacionvehiculo)
                            .input('ctipodocidentidadpropietario', sql.Int, notificationData.thirdpartyVehicles[i].ctipodocidentidadpropietario)
                            .input('xdocidentidadpropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xdocidentidadpropietario)
                            .input('xnombrepropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xnombrepropietario)
                            .input('xapellidopropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xapellidopropietario)
                            .input('cestado', sql.Int, notificationData.thirdpartyVehicles[i].cestado)
                            .input('cciudad', sql.Int, notificationData.thirdpartyVehicles[i].cciudad)
                            .input('xdireccion', sql.NVarChar, notificationData.thirdpartyVehicles[i].xdireccion)
                            .input('xtelefonocelularpropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xtelefonocelularpropietario)
                            .input('xtelefonocasapropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xtelefonocasapropietario ? notificationData.thirdpartyVehicles[i].xtelefonocasapropietario : null)
                            .input('xemailpropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xemailpropietario)
                            .input('xobservacionpropietario', sql.NVarChar, notificationData.thirdpartyVehicles[i].xobservacionpropietario)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVVEHICULOTERCERONOTIFICACION (CNOTIFICACION, CTIPODOCIDENTIDADCONDUCTOR, XDOCIDENTIDADCONDUCTOR, XNOMBRECONDUCTOR, XAPELLIDOCONDUCTOR, XTELEFONOCELULARCONDUCTOR, XTELEFONOCASACONDUCTOR, XEMAILCONDUCTOR, XOBSERVACIONCONDUCTOR, XPLACA, CMARCA, CMODELO, CVERSION, FANO, CCOLOR, XOBSERVACIONVEHICULO, CTIPODOCIDENTIDADPROPIETARIO, XDOCIDENTIDADPROPIETARIO, XNOMBREPROPIETARIO, XAPELLIDOPROPIETARIO, CESTADO, CCIUDAD, XDIRECCION, XTELEFONOCELULARPROPIETARIO, XTELEFONOCASAPROPIETARIO, XEMAILPROPIETARIO, XOBSERVACIONPROPIETARIO, CUSUARIOCREACION, FCREACION) output inserted.CVEHICULOTERCERONOTIFICACION values (@cnotificacion, @ctipodocidentidadconductor, @xdocidentidadconductor, @xnombreconductor, @xapellidoconductor, @xtelefonocelularconductor, @xtelefonocasaconductor, @xemailconductor, @xobservacionconductor, @xplaca, @cmarca, @cmodelo, @cversion, @fano, @ccolor, @xobservacionvehiculo, @ctipodocidentidadpropietario, @xdocidentidadpropietario, @xnombrepropietario, @xapellidopropietario, @cestado, @cciudad, @xdireccion, @xtelefonocelularpropietario, @xtelefonocasapropietario, @xemailpropietario, @xobservacionpropietario, @cusuariocreacion, @fcreacion)')
                        if(notificationData.thirdpartyVehicles[i].replacements){
                            for(let j = 0; j < notificationData.thirdpartyVehicles[i].replacements.length; j++){
                                let subInsert = await pool.request()
                                    .input('cvehiculoterceronotificacion', sql.Int, insert.recordset[0].CVEHICULOTERCERONOTIFICACION)
                                    .input('crepuesto', sql.Int, notificationData.thirdpartyVehicles[i].replacements[j].crepuesto)
                                    .input('ctiporepuesto', sql.Int, notificationData.thirdpartyVehicles[i].replacements[j].ctiporepuesto)
                                    .input('ncantidad', sql.Int, notificationData.thirdpartyVehicles[i].replacements[j].ncantidad)
                                    .input('cniveldano', sql.Int, notificationData.thirdpartyVehicles[i].replacements[j].cniveldano)
                                    .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                                    .input('fcreacion', sql.DateTime, new Date())
                                    .query('insert into EVREPUESTOVEHICULOTERCERO (CVEHICULOTERCERONOTIFICACION, CREPUESTO, CTIPOREPUESTO, NCANTIDAD, CNIVELDANO, CUSUARIOCREACION, FCREACION) values (@cvehiculoterceronotificacion, @crepuesto, @ctiporepuesto, @ncantidad, @cniveldano, @cusuariocreacion, @fcreacion)')
                            }
                        }
                    }
                }
                if(notificationData.notes){
                    for(let i = 0; i < notificationData.notes.length; i++){
                        let insert = await pool.request()
                            .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                            .input('xnotanotificacion', sql.NVarChar, notificationData.notes[i].xnotanotificacion)
                            .input('xrutaarchivo', sql.NVarChar, notificationData.notes[i].xrutaarchivo)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVNOTANOTIFICACION (CNOTIFICACION, XNOTANOTIFICACION, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @xnotanotificacion, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(notificationData.replacements){
                    for(let i = 0; i < notificationData.replacements.length; i++){
                        let insert = await pool.request()
                            .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                            .input('crepuesto', sql.Int, notificationData.replacements[i].crepuesto)
                            .input('ctiporepuesto', sql.Int, notificationData.replacements[i].ctiporepuesto)
                            .input('ncantidad', sql.Int, notificationData.replacements[i].ncantidad)
                            .input('cniveldano', sql.Int, notificationData.replacements[i].cniveldano)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVREPUESTONOTIFICACION (CNOTIFICACION, CREPUESTO, CTIPOREPUESTO, NCANTIDAD, CNIVELDANO, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @crepuesto, @ctiporepuesto, @ncantidad, @cniveldano, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(notificationData.thirdparties){
                    for(let i = 0; i < notificationData.thirdparties.length; i++){
                        let insert = await pool.request()
                            .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                            .input('ctipodocidentidad', sql.Int, notificationData.thirdparties[i].ctipodocidentidad)
                            .input('xdocidentidad', sql.NVarChar, notificationData.thirdparties[i].xdocidentidad)
                            .input('xnombre', sql.NVarChar, notificationData.thirdparties[i].xnombre)
                            .input('xapellido', sql.NVarChar, notificationData.thirdparties[i].xapellido)
                            .input('xtelefonocelular', sql.NVarChar, notificationData.thirdparties[i].xtelefonocelular)
                            .input('xtelefonocasa', sql.NVarChar, notificationData.thirdparties[i].xtelefonocasa ?  notificationData.thirdparties[i].xtelefonocasa : null)
                            .input('xemail', sql.NVarChar, notificationData.thirdparties[i].xemail)
                            .input('xobservacion', sql.NVarChar, notificationData.thirdparties[i].xobservacion)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVTERCERONOTIFICACION (CNOTIFICACION, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XNOMBRE, XAPELLIDO, XTELEFONOCELULAR, XTELEFONOCASA, XEMAIL, XOBSERVACION, CUSUARIOCREACION, FCREACION) output inserted.CTERCERONOTIFICACION values (@cnotificacion, @ctipodocidentidad, @xdocidentidad, @xnombre, @xapellido, @xtelefonocelular, @xtelefonocasa, @xemail, @xobservacion, @cusuariocreacion, @fcreacion)')
                        if(notificationData.thirdparties[i].tracings){
                            for(let j = 0; j < notificationData.thirdparties[i].tracings.length; j++){
                                let subInsert = await pool.request()
                                    .input('cterceronotificacion', sql.Int, insert.recordset[0].CTERCERONOTIFICACION)
                                    .input('ctiposeguimiento', sql.Int, notificationData.thirdparties[i].tracings[j].ctiposeguimiento)
                                    .input('cmotivoseguimiento', sql.Int, notificationData.thirdparties[i].tracings[j].cmotivoseguimiento)
                                    .input('fseguimientotercero', sql.DateTime, notificationData.thirdparties[i].tracings[j].fseguimientotercero)
                                    .input('xobservacion', sql.NVarChar, notificationData.thirdparties[i].tracings[j].xobservacion)
                                    .input('bcerrado', sql.Bit, false)
                                    .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                                    .input('fcreacion', sql.DateTime, new Date())
                                    .query('insert into EVSEGUIMIENTOTERCERO (CTERCERONOTIFICACION, CTIPOSEGUIMIENTO, CMOTIVOSEGUIMIENTO, FSEGUIMIENTOTERCERO, XOBSERVACION, BCERRADO, CUSUARIOCREACION, FCREACION) values (@cterceronotificacion, @ctiposeguimiento, @cmotivoseguimiento, @fseguimientotercero, @xobservacion, @bcerrado, @cusuariocreacion, @fcreacion)')
                            }
                        }
                    }
                }
                if(notificationData.materialDamages){
                    for(let i = 0; i < notificationData.materialDamages.length; i++){
                        let insert = await pool.request()
                            .input('cnotificacion', sql.Int, result.recordset[0].CNOTIFICACION)
                            .input('cdanomaterial', sql.Int, notificationData.materialDamages[i].cdanomaterial)
                            .input('xmaterial', sql.NVarChar, notificationData.materialDamages[i].xmaterial)
                            .input('cniveldano', sql.Int, notificationData.materialDamages[i].cniveldano)
                            .input('xobservacion', sql.NVarChar, notificationData.materialDamages[i].xobservacion)
                            .input('ctipodocidentidad', sql.Int, notificationData.materialDamages[i].ctipodocidentidad)
                            .input('xdocidentidad', sql.NVarChar, notificationData.materialDamages[i].xdocidentidad)
                            .input('xnombre', sql.NVarChar, notificationData.materialDamages[i].xnombre)
                            .input('xapellido', sql.NVarChar, notificationData.materialDamages[i].xapellido)
                            .input('cestado', sql.Int, notificationData.materialDamages[i].cestado)
                            .input('cciudad', sql.Int, notificationData.materialDamages[i].cciudad)
                            .input('xdireccion', sql.NVarChar, notificationData.materialDamages[i].xdireccion)
                            .input('xtelefonocelular', sql.NVarChar, notificationData.materialDamages[i].xtelefonocelular)
                            .input('xtelefonocasa', sql.NVarChar, notificationData.materialDamages[i].xtelefonocasa ?  notificationData.thirdparties[i].xtelefonocasa : null)
                            .input('xemail', sql.NVarChar, notificationData.materialDamages[i].xemail)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVDANOMATERIALNOTIFICACION (CNOTIFICACION, CDANOMATERIAL, XMATERIAL, CNIVELDANO, XOBSERVACION, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XNOMBRE, XAPELLIDO, CESTADO, CCIUDAD, XDIRECCION, XTELEFONOCELULAR, XTELEFONOCASA, XEMAIL, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @cdanomaterial, @xmaterial, @cniveldano, @xobservacion, @ctipodocidentidad, @xdocidentidad, @xnombre, @xapellido, @cestado, @cciudad, @xdireccion, @xtelefonocelular, @xtelefonocasa, @xemail, @cusuariocreacion, @fcreacion)')
                    }
                }
                if(notificationData.serviceOrder){
                    for(let i = 0; i < notificationData.serviceOrder.length; i++){
                        let insert = await pool.request()
                        .input('cservicio', sql.Int, notificationData.cservicio)
                        .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                        .input('fcreacion', sql.DateTime, new Date())
                        .query('insert into EVORDENSERVICIO (CSERVICIO, FCREACION, CNOTIFICACION) values (@cservicio, @fcreacion, @cnotificacion)')
                    }
                }
                //sql.close();
                return { result: result };
            }else{
                //sql.close();
                
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationDataQuery: async(notificationData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), notificationData.cpais)
                .input('ccompania', sql.Int, notificationData.ccompania)
                .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                .query('select * from EVNOTIFICACION where CNOTIFICACION = @cnotificacion and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    getFleetContractCompleteDataQuery: async(ccontratoflota, searchData) => {
        try{
            let query = `select * from VWBUSCARCONTRATOFLOTADATA where CCOMPANIA = @ccompania and CCONTRATOFLOTA = @ccontratoflota`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ccontratoflota', sql.Int, ccontratoflota ? ccontratoflota : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    getNotificationNotesDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARNOTA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    getNotificationServiceOrderDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA where CNOTIFICACION = @cnotificacion order by corden');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },

    getNotificationReplacementsDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARREPUESTOXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationMaterialDamagesDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARDANOMATERIALXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationThirdpartiesDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from EVTERCERONOTIFICACION where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationThirdpartyVehiclesDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARVEHICULOTERCEROXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getTracingsThirdpartyDataQuery: async(cterceronotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cterceronotificacion', sql.Int, cterceronotificacion)
                .query('select * from VWBUSCARSEGUIMIENTOXTERCERODATA where CTERCERONOTIFICACION = @cterceronotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getReplacementsThirdpartyVehicleDataQuery: async(cvehiculoterceronotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cvehiculoterceronotificacion', sql.Int, cvehiculoterceronotificacion)
                .query('select * from VWBUSCARREPUESTOXVEHICULOTERCERODATA where CVEHICULOTERCERONOTIFICACION = @cvehiculoterceronotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getNotificationTracingsDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARSEGUIMIENTOXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createNotesByNotificationUpdateQuery: async(notes, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < notes.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('xnotanotificacion', sql.NVarChar, notes[i].xnotanotificacion)
                    .input('xrutaarchivo', sql.NVarChar, notes[i].xrutaarchivo)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVNOTANOTIFICACION (CNOTIFICACION, XNOTANOTIFICACION, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @xnotanotificacion, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateNotesByNotificationUpdateQuery: async(notes, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < notes.length; i++){
                let update = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cnotanotificacion', sql.Int, notes[i].cnotanotificacion)
                    .input('xnotanotificacion', sql.NVarChar, notes[i].xnotanotificacion)
                    .input('xrutaarchivo', sql.NVarChar, notes[i].xrutaarchivo)
                    .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVNOTANOTIFICACION set XNOTANOTIFICACION = @xnotanotificacion, XRUTAARCHIVO = @xrutaarchivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CNOTANOTIFICACION = @cnotanotificacion and CNOTIFICACION = @cnotificacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteNotesByNotificationUpdateQuery: async(notes, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < notes.length; i++){
                let erase = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cnotanotificacion', sql.Int, notes[i].cnotanotificacion)
                    .query('delete from EVNOTANOTIFICACION where CNOTIFICACION = @cnotificacion and CNOTANOTIFICACION = @cnotanotificacion');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    closeTracingsByNotificationUpdateQuery: async(notificationData) => {
        try{
            let pool = await sql.connect(config);
            let update = await pool.request()
                .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                .input('bcerrado', sql.Bit, true)
                .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update EVSEGUIMIENTONOTIFICACION set BCERRADO = @bcerrado, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CNOTIFICACION = @cnotificacion');

            //sql.close();
            return { result: update };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createTracingsByNotificationUpdateQuery: async(tracings, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < tracings.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('ctiposeguimiento', sql.Int, tracings[i].ctiposeguimiento)
                    .input('cmotivoseguimiento', sql.Int, tracings[i].cmotivoseguimiento)
                    .input('fseguimientonotificacion', sql.DateTime, tracings[i].fseguimientonotificacion)
                    .input('bcerrado', sql.Bit, false)
                    .input('xobservacion', sql.NVarChar, tracings[i].xobservacion)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVSEGUIMIENTONOTIFICACION (CNOTIFICACION, CTIPOSEGUIMIENTO, CMOTIVOSEGUIMIENTO, FSEGUIMIENTONOTIFICACION, BCERRADO, XOBSERVACION, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @ctiposeguimiento, @cmotivoseguimiento, @fseguimientonotificacion, @bcerrado, @xobservacion, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateTracingsByNotificationUpdateQuery: async(tracings, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < tracings.length; i++){
                let update = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cseguimientonotificacion', sql.Int, tracings[i].cseguimientonotificacion)
                    .input('ctiposeguimiento', sql.Int, tracings[i].ctiposeguimiento)
                    .input('cmotivoseguimiento', sql.Int, tracings[i].cmotivoseguimiento)
                    .input('xobservacion', sql.NVarChar, tracings[i].xobservacion)
                    .input('bcerrado', sql.Bit, tracings[i].bcerrado)
                    .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVSEGUIMIENTONOTIFICACION set CTIPOSEGUIMIENTO = @ctiposeguimiento, CMOTIVOSEGUIMIENTO = @cmotivoseguimiento, XOBSERVACION = @xobservacion, BCERRADO = @bcerrado, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSEGUIMIENTONOTIFICACION = @cseguimientonotificacion and CNOTIFICACION = @cnotificacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createReplacementsByNotificationUpdateQuery: async(replacements, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < replacements.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('crepuesto', sql.Int, replacements[i].crepuesto)
                    .input('ctiporepuesto', sql.Int, replacements[i].ctiporepuesto)
                    .input('ncantidad', sql.Int, replacements[i].ncantidad)
                    .input('cniveldano', sql.Int, replacements[i].cniveldano)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVREPUESTONOTIFICACION (CNOTIFICACION, CREPUESTO, CTIPOREPUESTO, NCANTIDAD, CNIVELDANO, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @crepuesto, @ctiporepuesto, @ncantidad, @cniveldano, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateReplacementsByNotificationUpdateQuery: async(replacements, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < replacements.length; i++){
                let update = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('crepuesto', sql.Int, replacements[i].crepuesto)
                    .input('ctiporepuesto', sql.Int, replacements[i].ctiporepuesto)
                    .input('ncantidad', sql.Int, replacements[i].ncantidad)
                    .input('cniveldano', sql.Int, replacements[i].cniveldano)
                    .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVREPUESTONOTIFICACION set NCANTIDAD = @ncantidad, CNIVELDANO = @cniveldano, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CREPUESTO = @crepuesto and CTIPOREPUESTO = @ctiporepuesto and CNOTIFICACION = @cnotificacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteReplacementsByNotificationUpdateQuery: async(replacements, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < replacements.length; i++){
                let erase = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('crepuesto', sql.Int, replacements[i].crepuesto)
                    .query('delete from EVREPUESTONOTIFICACION where CNOTIFICACION = @cnotificacion and CREPUESTO = @crepuesto');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateThirdpartiesByNotificationUpdateQuery: async(thirdparties, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < thirdparties.length; i++){
                if(thirdparties[i].tracingsResult){
                    if(thirdparties[i].tracingsResult.create){
                        for(let j = 0; j < thirdparties[i].tracingsResult.create.length; j++){
                            let subInsert = await pool.request()
                                .input('cterceronotificacion', sql.Int, thirdparties[i].cterceronotificacion)
                                .input('ctiposeguimiento', sql.Int, thirdparties[i].tracingsResult.create[j].ctiposeguimiento)
                                .input('cmotivoseguimiento', sql.Int, thirdparties[i].tracingsResult.create[j].cmotivoseguimiento)
                                .input('fseguimientotercero', sql.DateTime, thirdparties[i].tracingsResult.create[j].fseguimientotercero)
                                .input('xobservacion', sql.NVarChar, thirdparties[i].tracingsResult.create[j].xobservacion)
                                .input('bcerrado', sql.Bit, false)
                                .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                                .input('fcreacion', sql.DateTime, new Date())
                                .query('insert into EVSEGUIMIENTOTERCERO (CTERCERONOTIFICACION, CTIPOSEGUIMIENTO, CMOTIVOSEGUIMIENTO, FSEGUIMIENTOTERCERO, XOBSERVACION, BCERRADO, CUSUARIOCREACION, FCREACION) values (@cterceronotificacion, @ctiposeguimiento, @cmotivoseguimiento, @fseguimientotercero, @xobservacion, @bcerrado, @cusuariocreacion, @fcreacion)')
                            rowsAffected = rowsAffected + subInsert.rowsAffected;    
                        }
                    }
                    if(thirdparties[i].tracingsResult.update){
                        for(let j = 0; j < thirdparties[i].tracingsResult.update.length; j++){
                            let subUpdate = await pool.request()
                                .input('cterceronotificacion', sql.Int, thirdparties[i].cterceronotificacion)
                                .input('cseguimientotercero', sql.Int, thirdparties[i].tracingsResult.update[j].cseguimientotercero)
                                .input('ctiposeguimiento', sql.Int, thirdparties[i].tracingsResult.update[j].ctiposeguimiento)
                                .input('cmotivoseguimiento', sql.Int, thirdparties[i].tracingsResult.update[j].cmotivoseguimiento)
                                .input('xobservacion', sql.NVarChar, thirdparties[i].tracingsResult.update[j].xobservacion)
                                .input('bcerrado', sql.Bit, thirdparties[i].tracingsResult.update[j].bcerrado)
                                .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                                .input('fmodificacion', sql.DateTime, new Date())
                                .query('update EVSEGUIMIENTOTERCERO set CTIPOSEGUIMIENTO = @ctiposeguimiento, CMOTIVOSEGUIMIENTO = @cmotivoseguimiento, XOBSERVACION = @xobservacion, BCERRADO = @bcerrado, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSEGUIMIENTOTERCERO = @cseguimientotercero and CTERCERONOTIFICACION = @cterceronotificacion');
                            rowsAffected = rowsAffected + subUpdate.rowsAffected;
                        }
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createMaterialDamagesByNotificationUpdateQuery: async(materialDamages, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < materialDamages.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cdanomaterial', sql.Int, materialDamages[i].cdanomaterial)
                    .input('xmaterial', sql.NVarChar, materialDamages[i].xmaterial)
                    .input('cniveldano', sql.Int, materialDamages[i].cniveldano)
                    .input('xobservacion', sql.NVarChar, materialDamages[i].xobservacion)
                    .input('ctipodocidentidad', sql.Int, materialDamages[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, materialDamages[i].xdocidentidad)
                    .input('xnombre', sql.NVarChar, materialDamages[i].xnombre)
                    .input('xapellido', sql.NVarChar, materialDamages[i].xapellido)
                    .input('cestado', sql.Int, materialDamages[i].cestado)
                    .input('cciudad', sql.Int, materialDamages[i].cciudad)
                    .input('xdireccion', sql.NVarChar, materialDamages[i].xdireccion)
                    .input('xtelefonocelular', sql.NVarChar, materialDamages[i].xtelefonocelular)
                    .input('xtelefonocasa', sql.NVarChar, materialDamages[i].xtelefonocasa ?  materialDamages[i].xtelefonocasa : null)
                    .input('xemail', sql.NVarChar, materialDamages[i].xemail)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVDANOMATERIALNOTIFICACION (CNOTIFICACION, CDANOMATERIAL, XMATERIAL, CNIVELDANO, XOBSERVACION, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XNOMBRE, XAPELLIDO, CESTADO, CCIUDAD, XDIRECCION, XTELEFONOCELULAR, XTELEFONOCASA, XEMAIL, CUSUARIOCREACION, FCREACION) values (@cnotificacion, @cdanomaterial, @xmaterial, @cniveldano, @xobservacion, @ctipodocidentidad, @xdocidentidad, @xnombre, @xapellido, @cestado, @cciudad, @xdireccion, @xtelefonocelular, @xtelefonocasa, @xemail, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateMaterialDamagesByNotificationUpdateQuery: async(materialDamages, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < materialDamages.length; i++){
                let update = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cdanomaterialnotificacion', sql.Int, materialDamages[i].cdanomaterialnotificacion)
                    .input('cdanomaterial', sql.Int, materialDamages[i].cdanomaterial)
                    .input('xmaterial', sql.NVarChar, materialDamages[i].xmaterial)
                    .input('cniveldano', sql.Int, materialDamages[i].cniveldano)
                    .input('xobservacion', sql.NVarChar, materialDamages[i].xobservacion)
                    .input('ctipodocidentidad', sql.Int, materialDamages[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, materialDamages[i].xdocidentidad)
                    .input('xnombre', sql.NVarChar, materialDamages[i].xnombre)
                    .input('xapellido', sql.NVarChar, materialDamages[i].xapellido)
                    .input('cestado', sql.Int, materialDamages[i].cestado)
                    .input('cciudad', sql.Int, materialDamages[i].cciudad)
                    .input('xdireccion', sql.NVarChar, materialDamages[i].xdireccion)
                    .input('xtelefonocelular', sql.NVarChar, materialDamages[i].xtelefonocelular)
                    .input('xtelefonocasa', sql.NVarChar, materialDamages[i].xtelefonocasa ?  materialDamages[i].xtelefonocasa : null)
                    .input('xemail', sql.NVarChar, materialDamages[i].xemail)
                    .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVDANOMATERIALNOTIFICACION SET CNOTIFICACION = @cnotificacion, CDANOMATERIAL = @cdanomaterial, XMATERIAL = @xmaterial, CNIVELDANO = @cniveldano, XOBSERVACION = @xobservacion, CTIPODOCIDENTIDAD = ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XNOMBRE = @xnombre, XAPELLIDO = @xapellido, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCION = @xdireccion, XTELEFONOCELULAR = @xtelefonocelular, XTELEFONOCASA = @xtelefonocasa, XEMAIL = @xemail, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion where CNOTIFICACION = @cnotificacion and CDANOMATERIALNOTIFICACION = @cdanomaterialnotificacion')
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteMaterialDamagesByNotificationUpdateQuery: async(materialDamages, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < materialDamages.length; i++){
                let erase = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cdanomaterialnotificacion', sql.Int, materialDamages[i].cdanomaterialnotificacion)
                    .query('delete from EVDANOMATERIALNOTIFICACION where CNOTIFICACION = @cnotificacion and CDANOMATERIALNOTIFICACION = @cdanomaterialnotificacion');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createThirdPartyVehiclesByNotificationUpdateQuery: async(thirdpartyVehicles, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < thirdpartyVehicles.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('ctipodocidentidadconductor', sql.Int, thirdpartyVehicles[i].ctipodocidentidadconductor)
                    .input('xdocidentidadconductor', sql.NVarChar, thirdpartyVehicles[i].xdocidentidadconductor)
                    .input('xnombreconductor', sql.NVarChar, thirdpartyVehicles[i].xnombreconductor)
                    .input('xapellidoconductor', sql.NVarChar, thirdpartyVehicles[i].xapellidoconductor)
                    .input('xtelefonocelularconductor', sql.NVarChar, thirdpartyVehicles[i].xtelefonocelularconductor)
                    .input('xtelefonocasaconductor', sql.NVarChar, thirdpartyVehicles[i].xtelefonocasaconductor ? thirdpartyVehicles[i].xtelefonocasaconductor : null)
                    .input('xemailconductor', sql.NVarChar, thirdpartyVehicles[i].xemailconductor)
                    .input('xobservacionconductor', sql.NVarChar, thirdpartyVehicles[i].xobservacionconductor)
                    .input('xplaca', sql.NVarChar, thirdpartyVehicles[i].xplaca)
                    .input('cmarca', sql.Int, thirdpartyVehicles[i].cmarca)
                    .input('cmodelo', sql.Int, thirdpartyVehicles[i].cmodelo)
                    .input('cversion', sql.Int, thirdpartyVehicles[i].cversion)
                    .input('fano', sql.Numeric(4, 0), thirdpartyVehicles[i].fano)
                    .input('ccolor', sql.Int, thirdpartyVehicles[i].ccolor)
                    .input('xobservacionvehiculo', sql.NVarChar, thirdpartyVehicles[i].xobservacionvehiculo)
                    .input('ctipodocidentidadpropietario', sql.Int, thirdpartyVehicles[i].ctipodocidentidadpropietario)
                    .input('xdocidentidadpropietario', sql.NVarChar, thirdpartyVehicles[i].xdocidentidadpropietario)
                    .input('xnombrepropietario', sql.NVarChar, thirdpartyVehicles[i].xnombrepropietario)
                    .input('xapellidopropietario', sql.NVarChar, thirdpartyVehicles[i].xapellidopropietario)
                    .input('cestado', sql.Int, thirdpartyVehicles[i].cestado)
                    .input('cciudad', sql.Int, thirdpartyVehicles[i].cciudad)
                    .input('xdireccion', sql.NVarChar, thirdpartyVehicles[i].xdireccion)
                    .input('xtelefonocelularpropietario', sql.NVarChar, thirdpartyVehicles[i].xtelefonocelularpropietario)
                    .input('xtelefonocasapropietario', sql.NVarChar, thirdpartyVehicles[i].xtelefonocasapropietario ? thirdpartyVehicles[i].xtelefonocasapropietario : null)
                    .input('xemailpropietario', sql.NVarChar, thirdpartyVehicles[i].xemailpropietario)
                    .input('xobservacionpropietario', sql.NVarChar, thirdpartyVehicles[i].xobservacionpropietario)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVVEHICULOTERCERONOTIFICACION (CNOTIFICACION, CTIPODOCIDENTIDADCONDUCTOR, XDOCIDENTIDADCONDUCTOR, XNOMBRECONDUCTOR, XAPELLIDOCONDUCTOR, XTELEFONOCELULARCONDUCTOR, XTELEFONOCASACONDUCTOR, XEMAILCONDUCTOR, XOBSERVACIONCONDUCTOR, XPLACA, CMARCA, CMODELO, CVERSION, FANO, CCOLOR, XOBSERVACIONVEHICULO, CTIPODOCIDENTIDADPROPIETARIO, XDOCIDENTIDADPROPIETARIO, XNOMBREPROPIETARIO, XAPELLIDOPROPIETARIO, CESTADO, CCIUDAD, XDIRECCION, XTELEFONOCELULARPROPIETARIO, XTELEFONOCASAPROPIETARIO, XEMAILPROPIETARIO, XOBSERVACIONPROPIETARIO, CUSUARIOCREACION, FCREACION) output inserted.CVEHICULOTERCERONOTIFICACION values (@cnotificacion, @ctipodocidentidadconductor, @xdocidentidadconductor, @xnombreconductor, @xapellidoconductor, @xtelefonocelularconductor, @xtelefonocasaconductor, @xemailconductor, @xobservacionconductor, @xplaca, @cmarca, @cmodelo, @cversion, @fano, @ccolor, @xobservacionvehiculo, @ctipodocidentidadpropietario, @xdocidentidadpropietario, @xnombrepropietario, @xapellidopropietario, @cestado, @cciudad, @xdireccion, @xtelefonocelularpropietario, @xtelefonocasapropietario, @xemailpropietario, @xobservacionpropietario, @cusuariocreacion, @fcreacion)')
                if(thirdpartyVehicles[i].replacements){
                    for(let j = 0; j < thirdpartyVehicles[i].replacements.length; j++){
                        let subInsert = await pool.request()
                            .input('cvehiculoterceronotificacion', sql.Int, insert.recordset[0].CVEHICULOTERCERONOTIFICACION)
                            .input('crepuesto', sql.Int, thirdpartyVehicles[i].replacements[j].crepuesto)
                            .input('ctiporepuesto', sql.Int, thirdpartyVehicles[i].replacements[j].ctiporepuesto)
                            .input('ncantidad', sql.Int, thirdpartyVehicles[i].replacements[j].ncantidad)
                            .input('cniveldano', sql.Int, thirdpartyVehicles[i].replacements[j].cniveldano)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVREPUESTOVEHICULOTERCERO (CVEHICULOTERCERONOTIFICACION, CREPUESTO, CTIPOREPUESTO, NCANTIDAD, CNIVELDANO, CUSUARIOCREACION, FCREACION) values (@cvehiculoterceronotificacion, @crepuesto, @ctiporepuesto, @ncantidad, @cniveldano, @cusuariocreacion, @fcreacion)')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateThirdPartyVehiclesByNotificationUpdateQuery: async(thirdpartyVehicles, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < thirdpartyVehicles.length; i++){
                let update = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cvehiculoterceronotificacion', sql.Int, thirdpartyVehicles[i].cvehiculoterceronotificacion)
                    .input('ctipodocidentidadconductor', sql.Int, thirdpartyVehicles[i].ctipodocidentidadconductor)
                    .input('xdocidentidadconductor', sql.NVarChar, thirdpartyVehicles[i].xdocidentidadconductor)
                    .input('xnombreconductor', sql.NVarChar, thirdpartyVehicles[i].xnombreconductor)
                    .input('xapellidoconductor', sql.NVarChar, thirdpartyVehicles[i].xapellidoconductor)
                    .input('xtelefonocelularconductor', sql.NVarChar, thirdpartyVehicles[i].xtelefonocelularconductor)
                    .input('xtelefonocasaconductor', sql.NVarChar, thirdpartyVehicles[i].xtelefonocasaconductor ? thirdpartyVehicles[i].xtelefonocasaconductor : null)
                    .input('xemailconductor', sql.NVarChar, thirdpartyVehicles[i].xemailconductor)
                    .input('xobservacionconductor', sql.NVarChar, thirdpartyVehicles[i].xobservacionconductor)
                    .input('xplaca', sql.NVarChar, thirdpartyVehicles[i].xplaca)
                    .input('cmarca', sql.Int, thirdpartyVehicles[i].cmarca)
                    .input('cmodelo', sql.Int, thirdpartyVehicles[i].cmodelo)
                    .input('cversion', sql.Int, thirdpartyVehicles[i].cversion)
                    .input('fano', sql.Numeric(4, 0), thirdpartyVehicles[i].fano)
                    .input('ccolor', sql.Int, thirdpartyVehicles[i].ccolor)
                    .input('xobservacionvehiculo', sql.NVarChar, thirdpartyVehicles[i].xobservacionvehiculo)
                    .input('ctipodocidentidadpropietario', sql.Int, thirdpartyVehicles[i].ctipodocidentidadpropietario)
                    .input('xdocidentidadpropietario', sql.NVarChar, thirdpartyVehicles[i].xdocidentidadpropietario)
                    .input('xnombrepropietario', sql.NVarChar, thirdpartyVehicles[i].xnombrepropietario)
                    .input('xapellidopropietario', sql.NVarChar, thirdpartyVehicles[i].xapellidopropietario)
                    .input('cestado', sql.Int, thirdpartyVehicles[i].cestado)
                    .input('cciudad', sql.Int, thirdpartyVehicles[i].cciudad)
                    .input('xdireccion', sql.NVarChar, thirdpartyVehicles[i].xdireccion)
                    .input('xtelefonocelularpropietario', sql.NVarChar, thirdpartyVehicles[i].xtelefonocelularpropietario)
                    .input('xtelefonocasapropietario', sql.NVarChar, thirdpartyVehicles[i].xtelefonocasapropietario ? thirdpartyVehicles[i].xtelefonocasapropietario : null)
                    .input('xemailpropietario', sql.NVarChar, thirdpartyVehicles[i].xemailpropietario)
                    .input('xobservacionpropietario', sql.NVarChar, thirdpartyVehicles[i].xobservacionpropietario)
                    .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVVEHICULOTERCERONOTIFICACION SET CTIPODOCIDENTIDADCONDUCTOR = @ctipodocidentidadconductor, XDOCIDENTIDADCONDUCTOR = @xdocidentidadconductor, XNOMBRECONDUCTOR = @xnombreconductor, XAPELLIDOCONDUCTOR = @xapellidoconductor, XTELEFONOCELULARCONDUCTOR = @xtelefonocelularconductor, XTELEFONOCASACONDUCTOR = @xtelefonocasaconductor, XEMAILCONDUCTOR = @xemailconductor, XOBSERVACIONCONDUCTOR = @xobservacionconductor, XPLACA = @xplaca, CMARCA = @cmarca, CMODELO = @cmodelo, CVERSION = @cversion, FANO = @fano, CCOLOR = @ccolor, XOBSERVACIONVEHICULO = @xobservacionvehiculo, CTIPODOCIDENTIDADPROPIETARIO = @ctipodocidentidadpropietario, XDOCIDENTIDADPROPIETARIO = @xdocidentidadpropietario, XNOMBREPROPIETARIO = @xnombrepropietario, XAPELLIDOPROPIETARIO = @xapellidopropietario, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCION = @xdireccion, XTELEFONOCELULARPROPIETARIO = @xtelefonocelularpropietario, XTELEFONOCASAPROPIETARIO = @xtelefonocasapropietario, XEMAILPROPIETARIO = @xemailpropietario, XOBSERVACIONPROPIETARIO = @xobservacionpropietario, FMODIFICACION = @fmodificacion, CUSUARIOMODIFICACION = @cusuariomodificacion WHERE CNOTIFICACION = @cnotificacion and CVEHICULOTERCERONOTIFICACION = @cvehiculoterceronotificacion')
                if(thirdpartyVehicles[i].replacements){
                    for(let j = 0; j < thirdpartyVehicles[i].replacements.length; j++){
                        let subInsert = await pool.request()
                            // .input('cvehiculoterceronotificacion', sql.Int, update.recordset[0].CVEHICULOTERCERONOTIFICACION)
                            .input('cvehiculoterceronotificacion', sql.Int, thirdpartyVehicles[i].cvehiculoterceronotificacion)
                            .input('crepuesto', sql.Int, thirdpartyVehicles[i].replacements[j].crepuesto)
                            .input('ctiporepuesto', sql.Int, thirdpartyVehicles[i].replacements[j].ctiporepuesto)
                            .input('ncantidad', sql.Int, thirdpartyVehicles[i].replacements[j].ncantidad)
                            .input('cniveldano', sql.Int, thirdpartyVehicles[i].replacements[j].cniveldano)
                            .input('cusuariomodificacion', sql.Int, notificationData.cusuariomodificacion)
                            .input('fmodificacion', sql.DateTime, new Date())
                            .query('UPDATE EVREPUESTOVEHICULOTERCERO SET CTIPOREPUESTO = @ctiporepuesto, NCANTIDAD = @ncantidad, CNIVELDANO = @cniveldano, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion WHERE CVEHICULOTERCERONOTIFICACION = @cvehiculoterceronotificacion and CREPUESTO = @crepuesto')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteThirdPartyVehiclesByNotificationUpdateQuery: async(thirdpartyVehicles, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < thirdpartyVehicles.length; i++){
                let erase = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cvehiculoterceronotificacion', sql.Int, thirdpartyVehicles[i].cvehiculoterceronotificacion)
                    .query('delete from EVVEHICULOTERCERONOTIFICACION WHERE CNOTIFICACION = @cnotificacion and CVEHICULOTERCERONOTIFICACION = @cvehiculoterceronotificacion');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createServiceOrderByNotificationUpdateQuery: async(serviceOrderCreateList, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < serviceOrderCreateList.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('ccompania', sql.Int, notificationData.ccompania)
                    .input('cpais', sql.Int, notificationData.cpais)
                    .input('cservicio', sql.Int, serviceOrderCreateList[i].cservicio)
                    .input('xobservacion', sql.NVarChar, serviceOrderCreateList[i].xobservacion)
                    .input('cservicioadicional', sql.Int, serviceOrderCreateList[i].cservicioadicional ? serviceOrderCreateList[i].cservicioadicional : undefined)
                    .input('xdanos', sql.NVarChar, serviceOrderCreateList[i].xdanos)
                    .input('xfecha', sql.NVarChar, serviceOrderCreateList[i].xfecha)
                    .input('fajuste', sql.DateTime, serviceOrderCreateList[i].fajuste)
                    .input('xdesde', sql.NVarChar, serviceOrderCreateList[i].xdesde)
                    .input('xhacia', sql.NVarChar, serviceOrderCreateList[i].xhacia)
                    .input('mmonto', sql.Numeric(18,2), serviceOrderCreateList[i].mmonto ? serviceOrderCreateList[i].mmonto: 0)
                    .input('mmontototal', sql.Numeric(18,2), serviceOrderCreateList[i].mmontototal)
                    .input('mmontototaliva', sql.Numeric(18,2), serviceOrderCreateList[i].mmontototaliva)
                    .input('cimpuesto', sql.Int(), serviceOrderCreateList[i].cimpuesto)
                    .input('pimpuesto', sql.Numeric(5, 2), serviceOrderCreateList[i].pimpuesto)
                    .input('cmoneda', sql.Int, serviceOrderCreateList[i].cmoneda)
                    .input('cproveedor', sql.NVarChar, serviceOrderCreateList[i].cproveedor)
                    .input('xmensaje', sql.NVarChar, serviceOrderCreateList[i].xmensaje)
                    .input('xrutaarchivo', sql.NVarChar, serviceOrderCreateList[i].xrutaarchivo)
                    .input('ccotizacion', sql.Int, serviceOrderCreateList[i].ccotizacion)
                    .input('cestatusgeneral', sql.Int, 13)
                    .input('ccausaanulacion', sql.Int, serviceOrderCreateList[i].ccausaanulacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVORDENSERVICIO (CSERVICIO, FCREACION, CNOTIFICACION, XOBSERVACION, CSERVICIOADICIONAL, CCOTIZACION, XDANOS, XFECHA, FAJUSTE, XDESDE, XHACIA, MMONTO, MMONTOTOTAL, CMONEDA, CIMPUESTO, PIMPUESTO, MMONTOTOTALIVA, XMENSAJE, XRUTAARCHIVO, CPROVEEDOR, CCOMPANIA, CPAIS, CESTATUSGENERAL, CCAUSAANULACION, BACTIVO) values (@cservicio, @fcreacion, @cnotificacion, @xobservacion, @cservicioadicional, @ccotizacion, @xdanos, @xfecha, @fajuste, @xdesde, @xhacia, @mmonto, @mmontototal, @cmoneda, @cimpuesto, @pimpuesto, @mmontototaliva, @xmensaje, @xrutaarchivo, @cproveedor, @ccompania, @cpais, @cestatusgeneral, @ccausaanulacion, 1)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){

            return { error: err.message };
        }
    },

    updateServiceOrderByNotificationUpdateQuery: async(serviceOrderUpdateList, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < serviceOrderUpdateList.length; i++){
                let update = await pool.request()
                //.input('cnotificacion', sql.Int, notificationData.cnotificacion)
                .input('corden', sql.Int, serviceOrderUpdateList[i].corden)
                .input('bactivo', sql.Bit, serviceOrderUpdateList[i].bactivo)
                .input('cestatusgeneral', sql.Int, serviceOrderUpdateList[i].cestatusgeneral)
                .input('ccausaanulacion', sql.Int, serviceOrderUpdateList[i].ccausaanulacion)
                .query('update EVORDENSERVICIO set BACTIVO = @bactivo, CESTATUSGENERAL = @cestatusgeneral, CCAUSAANULACION = @ccausaanulacion WHERE CORDEN = @corden');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },

    updateClausesByClausesUpdateQuery: async(clausesUpdateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < clausesUpdateList.length; i++){
                let update = await pool.request()
                .input('cclausula', sql.Int, clausesUpdateList[i].cclausula)
                .input('xclausulas', sql.NVarChar, clausesUpdateList[i].xclausulas)
                .input('xobjetivo', sql.NVarChar, clausesUpdateList[i].xobjetivo)
                .input('xobservacion', sql.NVarChar, clausesUpdateList[i].xobservacion)
                .query('update MACLAUSULAS set XCLAUSULAS = @xclausulas, XOBJETIVO = @xobjetivo, XOBSERVACION = @xobservacion, BACTIVO = 1 WHERE CCLAUSULA = @cclausula');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },

    updateExhibitByClausesUpdateQuery: async(exhibitUpdateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < exhibitUpdateList.length; i++){
                let update = await pool.request()
                .input('canexo', sql.Int, exhibitUpdateList[i].canexo)
                .query('update MAANEXO set BACTIVO = 1 WHERE CANEXO = @canexo');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },

    getServicesByNotificationTypeDataQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cproveedor', sql.Int, cproveedor)
                .query('select * from VWBUSCARPROVEEDORXSERVICIO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createServicesByNotificationTypeUpdateQuery: async(services, notificationTypeData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let insert = await pool.request()
                    .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('cusuariocreacion', sql.Int, notificationTypeData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into CNSERVICIOTIPONOTIFICACION (CTIPONOTIFICACION, CSERVICIO, CTIPOSERVICIO, CUSUARIOCREACION, FCREACION) values (@ctiponotificacion, @cservicio, @ctiposervicio, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateServicesByNotificationTypeUpdateQuery: async(services, notificationTypeData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let update = await pool.request()
                    .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('cusuariomodificacion', sql.Int, notificationTypeData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update CNSERVICIOTIPONOTIFICACION set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTIPONOTIFICACION = @ctiponotificacion and CSERVICIO = @cservicio and CTIPOSERVICIO = @ctiposervicio');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteServicesByNotificationTypeUpdateQuery: async(services, notificationTypeData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let erase = await pool.request()
                    .input('ctiponotificacion', sql.Int, notificationTypeData.ctiponotificacion)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .query('delete from CNSERVICIOTIPONOTIFICACION where CSERVICIO = @cservicio and CTIPONOTIFICACION = @ctiponotificacion');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getProvidersByServicesDataQuery: async() =>{
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                //.input('cproveedor', sql.Int, cproveedor)
                .query('select * from PRPROVEEDORES');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createProvidersByNotificationUpdateQuery: async(providers, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < providers.length; i++){
                let insert = await pool.request()
                    .input('cnotificacion', sql.Int, notificationData.cnotificacion)
                    .input('cproveedor', sql.Int, providers[i].cproveedor)
                    .input('xobservacion', sql.NVarChar, providers[i].xobservacion)
                    .input('bcerrada', sql.Bit, false)
                    .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into EVCOTIZACIONNOTIFICACION (CNOTIFICACION, CPROVEEDOR, XOBSERVACION, BCERRADA, CUSUARIOCREACION, FCREACION) output inserted.CCOTIZACION values (@cnotificacion, @cproveedor, @xobservacion, @bcerrada, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
                if(insert.rowsAffected > 0 && providers[i].replacements){
                    for(let j = 0; j < providers[i].replacements.length; j++){
                        let subInsert = await pool.request()
                            .input('ccotizacion', sql.Int, insert.recordset[0].CCOTIZACION)
                            .input('crepuesto', sql.Int, providers[i].replacements[j].crepuesto)
                            .input('ctiporepuesto', sql.Int, providers[i].replacements[j].ctiporepuesto)
                            .input('ncantidad', sql.Int, providers[i].replacements[j].ncantidad)
                            .input('cniveldano', sql.Int, providers[i].replacements[j].cniveldano)
                            .input('cusuariocreacion', sql.Int, notificationData.cusuariomodificacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into EVREPUESTOCOTIZACION (CCOTIZACION, CREPUESTO, CTIPOREPUESTO, NCANTIDAD, CNIVELDANO, CUSUARIOCREACION, FCREACION) values (@ccotizacion, @crepuesto, @ctiporepuesto, @ncantidad, @cniveldano, @cusuariocreacion, @fcreacion)')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getNotificationProvidersDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getReplacementsProviderDataQuery: async(ccotizacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccotizacion', sql.Int, ccotizacion)
                .query('select * from VWBUSCARREPUESTOXCOTIZACIONDATA where CCOTIZACION = @ccotizacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getUserProviderDataQuery: async(cproveedor, cpais, ccompania) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), cpais)
                .input('ccompania', sql.Int, ccompania)
                .input('cproveedor', sql.Int, cproveedor)
                .query('select * from PRPROVEEDOR where CPROVEEDOR = @cproveedor and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchQuoteRequestQuery: async(searchData) => {
        try{
            let query = `select * from EVCOTIZACIONNOTIFICACION where CPROVEEDOR = @cproveedor${ searchData.fcreacion ? " and datediff(day, FCREACION, @fcreacion) = 0" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, searchData.cproveedor ? searchData.cproveedor : 2)
                .input('fcreacion', sql.DateTime, searchData.fcreacion ? searchData.fcreacion : '01/01/2000')
                .query(query);
            //sql.close();

            return { result: result };
        }catch(err){
           
            return { error: err.message };
        }
    },
    searchQuoteListRequestQuery: async(searchData) => {
        try{
            let query = `select * from EVCOTIZACIONNOTIFICACION where CNOTIFICACION = @cnotificacion`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, searchData.cnotificacion)
                //.input('baceptacion', sql.Int, searchData.baceptacion ? searchData.baceptacion: 0)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getQuoteRequestDataQuery: async(quoteRequestData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
                .input('cproveedor', sql.Int, quoteRequestData.cproveedor)
                .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CCOTIZACION = @ccotizacion and CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getQuoteListRequestDataQuery: async(quoteRequestData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
                .input('cnotificacion', sql.Int, quoteRequestData.cnotificacion)
                //.input('baceptacion', sql.Bit, quoteRequestData.baceptacion)
                .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CCOTIZACION = @ccotizacion and CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateQuoteRequestQuery: async(quoteRequestData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cproveedor', sql.Int, quoteRequestData.cproveedor)
                .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
                .input('mtotalcotizacion', sql.Numeric(11, 2), quoteRequestData.mtotalcotizacion ? quoteRequestData.mtotalcotizacion : null)
                .input('bcerrada', sql.Bit, quoteRequestData.bcerrada)
                .input('cusuariomodificacion', sql.Int, quoteRequestData.cusuariomodificacion)
                .input('baceptacion', sql.Bit, quoteRequestData.baceptacion)
                .input('cmoneda', sql.Int, quoteRequestData.cmoneda)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update EVCOTIZACIONNOTIFICACION set MTOTALCOTIZACION = @mtotalcotizacion, BCERRADA = @bcerrada, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, BACEPTACION = @baceptacion, CMONEDA = @cmoneda where CCOTIZACION = @ccotizacion and CPROVEEDOR = @cproveedor');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateQuotesByNotificationUpdateQuery: async(quotesUpdateList, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < quotesUpdateList.length; i++){
                let update = await pool.request()
                .input('ccotizacion', sql.Int, quotesUpdateList[i].ccotizacion)
                .input('cnotificacion', sql.Int, quotesUpdateList[i].cnotificacion)
                .input('baceptacion', sql.Bit, quotesUpdateList[i].baceptacion)
                .input('cimpuesto', sql.Int, quotesUpdateList[i].cimpuesto)
                .input('pimpuesto', sql.Numeric(5,2), quotesUpdateList[i].pimpuesto)
                .input('mmontoiva', sql.Numeric(18,2), quotesUpdateList[i].mmontoiva)
                .input('mtotal', sql.Numeric(18,2), quotesUpdateList[i].mtotal)
                .query('update EVCOTIZACIONNOTIFICACION set BACEPTACION = @baceptacion, CIMPUESTO = @cimpuesto, PIMPUESTO = @pimpuesto, MMONTOIVA = @mmontoiva, MTOTAL = @mtotal WHERE CNOTIFICACION = @cnotificacion AND CCOTIZACION = @ccotizacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateReplacementsByQuoteRequestUpdateQuery: async(replacements, quoteRequestData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < replacements.length; i++){
                let update = await pool.request()
                    .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
                    .input('crepuestocotizacion', sql.Int, replacements[i].crepuestocotizacion)
                    .input('bdisponible', sql.Bit, replacements[i].bdisponible)
                    .input('bdescuento', sql.Bit, replacements[i].bdescuento)
                    .input('munitariorepuesto', sql.Numeric(11, 2), replacements[i].munitariorepuesto ? replacements[i].munitariorepuesto : null)
                    .input('mtotalrepuesto', sql.Numeric(11, 2), replacements[i].mtotalrepuesto ? replacements[i].mtotalrepuesto : null)
                    .input('cusuariomodificacion', sql.Int, quoteRequestData.cusuariomodificacion)
                    .input('cmoneda', sql.Int, quoteRequestData.cmoneda)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update EVREPUESTOCOTIZACION set BDISPONIBLE = @bdisponible, BDESCUENTO = @bdescuento, MUNITARIOREPUESTO = @munitariorepuesto, MTOTALREPUESTO = @mtotalrepuesto, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, CMONEDA = @cmoneda where CREPUESTOCOTIZACION = @crepuestocotizacion and CCOTIZACION = @ccotizacion');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getNotificationQuotesDataQuery: async(cnotificacion) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, cnotificacion)
                .input('bcerrada', sql.Bit, true)
                .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CNOTIFICACION = @cnotificacion and BCERRADA = @bcerrada');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPlanQuery: async(searchData) => {
        try{
            let query = `select * from VWBUSCARPLANDATA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ctipoplan ? " and CTIPOPLAN = @ctipoplan" : '' }${ searchData.xplan ? " and XPLAN like '%" + searchData.xplan + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipoplan', sql.Int, searchData.ctipoplan ? searchData.ctipoplan : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPlanNameToCreateQuery: async(planData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planData.cpais)
                .input('ccompania', sql.Int, planData.ccompania)
                .input('ctipoplan', sql.Int, planData.ctipoplan)
                .input('xplan', sql.NVarChar, planData.xplan)
                .query('select * from POPLAN where XPLAN = @xplan and CTIPOPLAN = @ctipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createPlanQuery: async(planData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xplan', sql.NVarChar, planData.xplan)
                .input('ctipoplan', sql.Int, planData.ctipoplan)
                .input('mplan', sql.Numeric(11, 2), planData.mplan)
                .input('bactivo', sql.Bit, planData.bactivo)
                .input('cpais', sql.Numeric(4, 0), planData.cpais)
                .input('ccompania', sql.Int, planData.ccompania)
                .input('cusuariocreacion', sql.Int, planData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into POPLAN (XPLAN, CTIPOPLAN, MPLAN, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) values (@xplan, @ctipoplan, @mplan, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('xplan', sql.NVarChar, planData.xplan)
                    .input('ctipoplan', sql.Int, planData.ctipoplan)
                    .input('cpais', sql.Numeric(4, 0), planData.cpais)
                    .input('ccompania', sql.Int, planData.ccompania)
                    .query('select * from POPLAN where XPLAN = @xplan and CTIPOPLAN = @ctipoplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && planData.insurers){
                    for(let i = 0; i < planData.insurers.length; i++){
                        let insert = await pool.request()
                            .input('cplan', sql.Int, query.recordset[0].CPLAN)
                            .input('caseguradora', sql.Int, planData.insurers[i].caseguradora)
                            .input('cusuariocreacion', sql.Int, planData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into POASEGURADORAPLAN (CPLAN, CASEGURADORA, CUSUARIOCREACION, FCREACION) values (@cplan, @caseguradora, @cusuariocreacion, @fcreacion)')
                        }
                }
                if(query.rowsAffected > 0 && planData.services){
                    for(let i = 0; i < planData.services.length; i++){
                        let insert = await pool.request()
                            .input('cplan', sql.Int, query.recordset[0].CPLAN)
                            .input('cservicio', sql.Int, planData.services[i].cservicio)
                            .input('ctiposervicio', sql.Int, planData.services[i].ctiposervicio)
                            .input('ctipoagotamientoservicio', sql.Int, planData.services[i].ctipoagotamientoservicio)
                            .input('ncantidad', sql.Int, planData.services[i].ncantidad)
                            .input('pservicio', sql.Numeric(5, 2), planData.services[i].pservicio)
                            .input('mmaximocobertura', sql.Numeric(11, 2), planData.services[i].mmaximocobertura)
                            .input('mdeducible', sql.Numeric(11, 2), planData.services[i].mdeducible)
                            .input('bserviciopadre', sql.Bit, planData.services[i].bserviciopadre)
                            .input('cusuariocreacion', sql.Int, planData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into POSERVICIOPLAN (CPLAN, CSERVICIO, CTIPOSERVICIO, CTIPOAGOTAMIENTOSERVICIO, NCANTIDAD, PSERVICIO, MMAXIMOCOBERTURA, MDEDUCIBLE, BSERVICIOPADRE, CUSUARIOCREACION, FCREACION) output inserted.CSERVICIOPLAN values (@cplan, @cservicio, @ctiposervicio, @ctipoagotamientoservicio, @ncantidad, @pservicio, @mmaximocobertura, @mdeducible, @bserviciopadre, @cusuariocreacion, @fcreacion)')
                        if(planData.services[i].coverages){
                            for(let j = 0; j < planData.services[i].coverages.length; j++){
                                let subInsert = await pool.request()
                                    .input('cservicioplan', sql.Int, insert.recordset[0].CSERVICIOPLAN)
                                    .input('ccobertura', sql.Int, planData.services[i].coverages[j].ccobertura)
                                    .input('cconceptocobertura', sql.Numeric(4, 0), planData.services[i].coverages[j].cconceptocobertura)
                                    .input('cusuariocreacion', sql.Int, planData.cusuariocreacion)
                                    .input('fcreacion', sql.DateTime, new Date())
                                    .query('insert into POCOBERTURASERVICIO (CSERVICIOPLAN, CCOBERTURA, CCONCEPTOCOBERTURA, CUSUARIOCREACION, FCREACION) values (@cservicioplan, @ccobertura, @cconceptocobertura, @cusuariocreacion, @fcreacion)')
                            }
                        }
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getParentPolicyBatches: async(ccarga) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CCARGA', sql.Int, ccarga)
                .query('SELECT * FROM SUPOLIZALOTE WHERE CCARGA = @CCARGA');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getBatchContractsDataQuery: async(ccarga, clote) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('CCARGA', sql.Int, ccarga)
                .input('CLOTE', sql.Int, clote)
                .query('SELECT * FROM VWBUSCARCONTRATOSXLOTE WHERE CCARGA = @CCARGA AND CLOTE = @CLOTE AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getPlanDataQuery: async(planData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planData.cpais)
                .input('ccompania', sql.Int, planData.ccompania)
                .input('cplan', sql.Int, planData.cplan)
                .query('select * from POPLAN where CPAIS = @cpais and CCOMPANIA = @ccompania and CPLAN = @cplan');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getPlanInsurersDataQuery: async(cplan) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cplan', sql.Int, cplan)
                .query('select * from VWBUSCARASEGURADORAXPLANDATA where CPLAN = @cplan');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getPlanServicesDataQuery: async(cplan) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cplan', sql.Int, cplan)
                .query('select * from VWBUSCARTIPOSERVICIOSXPLAN where CPLAN = @cplan');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getCoveragesServiceDataQuery: async(cservicioplan) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cservicioplan', sql.Int, cservicioplan)
                .query('select * from VWBUSCARCOBERTURAXSERVICIODATA where CSERVICIOPLAN = @cservicioplan');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyPlanNameToUpdateQuery: async(planData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), planData.cpais)
                .input('ccompania', sql.Int, planData.ccompania)
                .input('xplan', sql.NVarChar, planData.xplan)
                .input('cplan', sql.Int, planData.cplan)
                .input('ctipoplan', sql.Int, planData.ctipoplan)
                .query('select * from POPLAN where XPLAN = @xplan and CPLAN != @cplan and CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOPLAN = @ctipoplan');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createInsurersByPlanUpdateQuery: async(insurers, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < insurers.length; i++){
                let insert = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('caseguradora', sql.Int, insurers[i].caseguradora)
                    .input('cusuariocreacion', sql.Int, planData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into POASEGURADORAPLAN (CPLAN, CASEGURADORA, CUSUARIOCREACION, FCREACION) values (@cplan, @caseguradora, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateInsurersByPlanUpdateQuery: async(insurers, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < insurers.length; i++){
                let update = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('caseguradora', sql.Int, insurers[i].caseguradora)
                    .input('cusuariomodificacion', sql.Int, planData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update POASEGURADORAPLAN set CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CASEGURADORA = @caseguradora and CPLAN = @cplan');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteInsurersByPlanUpdateQuery: async(insurers, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < insurers.length; i++){
                let erase = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('caseguradora', sql.Int, insurers[i].caseguradora)
                    .query('delete from POASEGURADORAPLAN where CASEGURADORA = @caseguradora and CPLAN = @cplan');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createServicesByPlanUpdateQuery: async(services, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let insert = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('ctipoagotamientoservicio', sql.Int, services[i].ctipoagotamientoservicio)
                    .input('ncantidad', sql.Int, services[i].ncantidad)
                    .input('pservicio', sql.Numeric(5, 2), services[i].pservicio)
                    .input('mmaximocobertura', sql.Numeric(11, 2), services[i].mmaximocobertura)
                    .input('mdeducible', sql.Numeric(11, 2), services[i].mdeducible)
                    .input('bserviciopadre', sql.Bit, services[i].bserviciopadre)
                    .input('cusuariocreacion', sql.Int, planData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into POSERVICIOPLAN (CPLAN, CSERVICIO, CTIPOSERVICIO, CTIPOAGOTAMIENTOSERVICIO, NCANTIDAD, PSERVICIO, MMAXIMOCOBERTURA, MDEDUCIBLE, BSERVICIOPADRE, CUSUARIOCREACION, FCREACION) output inserted.CSERVICIOPLAN values (@cplan, @cservicio, @ctiposervicio, @ctipoagotamientoservicio, @ncantidad, @pservicio, @mmaximocobertura, @mdeducible, @bserviciopadre, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
                if(insert.rowsAffected > 0 && services[i].coverages){
                    for(let j = 0; j < services[i].coverages.length; j++){
                        let subInsert = await pool.request()
                            .input('cservicioplan', sql.Int, insert.recordset[0].CSERVICIOPLAN)
                            .input('ccobertura', sql.Int, services[i].coverages[j].ccobertura)
                            .input('cconceptocobertura', sql.Int, services[i].coverages[j].cconceptocobertura)
                            .input('cusuariocreacion', sql.Int, planData.cusuariomodificacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into POCOBERTURASERVICIO (CSERVICIOPLAN, CCOBERTURA, CCONCEPTOCOBERTURA, CUSUARIOCREACION, FCREACION) values (@cservicioplan, @ccobertura, @cconceptocobertura, @cusuariocreacion, @fcreacion)')
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateServicesByPlanUpdateQuery: async(services, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let update = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('cservicioplan', sql.Int, services[i].cservicioplan)
                    .input('ctiposervicio', sql.Int, services[i].ctiposervicio)
                    .input('ctipoagotamientoservicio', sql.Int, services[i].ctipoagotamientoservicio)
                    .input('ncantidad', sql.Int, services[i].ncantidad)
                    .input('pservicio', sql.Numeric(5, 2), services[i].pservicio)
                    .input('mmaximocobertura', sql.Numeric(11, 2), services[i].mmaximocobertura)
                    .input('mdeducible', sql.Numeric(11, 2), services[i].mdeducible)
                    .input('bserviciopadre', sql.Bit, services[i].bserviciopadre)
                    .input('cusuariomodificacion', sql.Int, planData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update POSERVICIOPLAN set CTIPOAGOTAMIENTOSERVICIO = @ctipoagotamientoservicio, NCANTIDAD = @ncantidad, PSERVICIO = @pservicio, MMAXIMOCOBERTURA = @mmaximocobertura, MDEDUCIBLE = @mdeducible, BSERVICIOPADRE = @bserviciopadre, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSERVICIO = @cservicio and CSERVICIOPLAN = @cservicioplan and CTIPOSERVICIO = @ctiposervicio and CPLAN = @cplan');
                rowsAffected = rowsAffected + update.rowsAffected;
                if(services[i].coveragesResult){
                    if(update.rowsAffected > 0 && services[i].coveragesResult.create){
                        for(let j = 0; j < services[i].coveragesResult.create.length; j++){
                            let subInsert = await pool.request()
                                .input('cservicioplan', sql.Int, services[i].cservicioplan)
                                .input('ccobertura', sql.Int, services[i].coveragesResult.create[j].ccobertura)
                                .input('cconceptocobertura', sql.Int, services[i].coveragesResult.create[j].cconceptocobertura)
                                .input('cusuariocreacion', sql.Int, planData.cusuariomodificacion)
                                .input('fcreacion', sql.DateTime, new Date())
                                .query('insert into POCOBERTURASERVICIO (CSERVICIOPLAN, CCOBERTURA, CCONCEPTOCOBERTURA, CUSUARIOCREACION, FCREACION) values (@cservicioplan, @ccobertura, @cconceptocobertura, @cusuariocreacion, @fcreacion)')
                        }
                    }
                    if(update.rowsAffected > 0 && services[i].coveragesResult.update){
                        for(let j = 0; j < services[i].coveragesResult.update.length; j++){
                            let subUpdate = await pool.request()
                                .input('cservicioplan', sql.Int, services[i].cservicioplan)
                                .input('ccobertura', sql.Int, services[i].coveragesResult.update[j].ccobertura)
                                .input('cconceptocobertura', sql.Int, services[i].coveragesResult.update[j].cconceptocobertura)
                                .input('cusuariomodificacion', sql.Int, planData.cusuariomodificacion)
                                .input('fmodificacion', sql.DateTime, new Date())
                                .query('update POCOBERTURASERVICIO set CCONCEPTOCOBERTURA = @cconceptocobertura, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CSERVICIOPLAN = @cservicioplan and CCOBERTURA = @ccobertura')
                        }
                    }
                    if(update.rowsAffected > 0 && services[i].coveragesResult.delete){
                        for(let j = 0; j < services[i].coveragesResult.delete.length; j++){
                            let subDelete = await pool.request()
                                .input('cservicioplan', sql.Int, services[i].cservicioplan)
                                .input('ccobertura', sql.Int, services[i].coveragesResult.delete[j].ccobertura)
                                .query('delete from POCOBERTURASERVICIO where CSERVICIOPLAN = @cservicioplan and CCOBERTURA = @ccobertura')
                        }
                    }
                }
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteServicesByPlanUpdateQuery: async(services, planData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < services.length; i++){
                let suberase = await pool.request()
                    .input('cservicioplan', sql.Int, services[i].cservicioplan)
                    .query('delete from POCOBERTURASERVICIO where CSERVICIOPLAN = @cservicioplan');
                let erase = await pool.request()
                    .input('cplan', sql.Int, planData.cplan)
                    .input('cservicio', sql.Int, services[i].cservicio)
                    .input('cservicioplan', sql.Int, services[i].cservicioplan)
                    .query('delete from POSERVICIOPLAN where CSERVICIO = @cservicio and CSERVICIOPLAN = @cservicioplan and CPLAN = @cplan');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    planValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ctipoplan', sql.Int, searchData.ctipoplan)
                .query('select * from POPLAN where CPAIS = @cpais and CCOMPANIA = @ccompania and CTIPOPLAN = @ctipoplan and BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchInsurerQuery: async(searchData) => {
        try{
            let query = `select * from TRASEGURADORA where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xaseguradora ? " and XASEGURADORA like '%" + searchData.xaseguradora + "%'" : '' }${ searchData.ctipodocidentidad ? " and CTIPODOCIDENTIDAD = @ctipodocidentidad" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : 1)
                .input('ctipodocidentidad', sql.Int, searchData.ctipodocidentidad ? searchData.ctipodocidentidad : 1)
                .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : 1)
                .input('xaseguradora', sql.NVarChar, searchData.xaseguradora ? searchData.xaseguradora : 1)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyInsurerIdentificationToCreateQuery: async(insurerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                .input('ccompania', sql.Int, insurerData.ccompania)
                .input('ctipodocidentidad', sql.Int, insurerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, insurerData.xdocidentidad)
                .query('select * from TRASEGURADORA where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createInsurerQuery: async(insurerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                .input('ccompania', sql.Int, insurerData.ccompania)
                .input('xaseguradora', sql.NVarChar, insurerData.xaseguradora)
                .input('xrepresentante', sql.NVarChar, insurerData.xrepresentante)
                .input('ctipodocidentidad', sql.Int, insurerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, insurerData.xdocidentidad)
                .input('cestado', sql.Int, insurerData.cestado)
                .input('cciudad', sql.Int, insurerData.cciudad)
                .input('xdireccionfiscal', sql.NVarChar, insurerData.xdireccionfiscal)
                .input('xemail', sql.NVarChar, insurerData.xemail)
                .input('xtelefono', sql.NVarChar, insurerData.xtelefono ? insurerData.xtelefono : null)
                .input('bnotificacionsms', sql.Bit, insurerData.bnotificacionsms)
                .input('xpaginaweb', sql.NVarChar, insurerData.xpaginaweb ? insurerData.xpaginaweb : null)
                .input('bactivo', sql.Bit, insurerData.bactivo)
                .input('cusuariocreacion', sql.Int, insurerData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TRASEGURADORA (CPAIS, CCOMPANIA, XASEGURADORA, XREPRESENTANTE, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, CESTADO, CCIUDAD, XDIRECCIONFISCAL, XEMAIL, XTELEFONO, BNOTIFICACIONSMS, XPAGINAWEB, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cpais, @ccompania, @xaseguradora, @xrepresentante, @ctipodocidentidad, @xdocidentidad, @cestado, @cciudad, @xdireccionfiscal, @xemail, @xtelefono, @bnotificacionsms, @xpaginaweb, @bactivo, @cusuariocreacion, @fcreacion)');
            if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                    .input('ccompania', sql.Int, insurerData.ccompania)
                    .input('ctipodocidentidad', sql.Int, insurerData.ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, insurerData.xdocidentidad)
                    .query('select * from TRASEGURADORA where CTIPODOCIDENTIDAD = @ctipodocidentidad and XDOCIDENTIDAD = @xdocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania');
                if(query.rowsAffected > 0 && insurerData.contacts){
                    for(let i = 0; i < insurerData.contacts.length; i++){
                        let insert = await pool.request()
                            .input('caseguradora', sql.Int, query.recordset[0].CASEGURADORA)
                            .input('xnombre', sql.NVarChar, insurerData.contacts[i].xnombre)
                            .input('xapellido', sql.NVarChar, insurerData.contacts[i].xapellido)
                            .input('ctipodocidentidad', sql.Int,  insurerData.contacts[i].ctipodocidentidad)
                            .input('xdocidentidad', sql.NVarChar, insurerData.contacts[i].xdocidentidad)
                            .input('xtelefonocelular', sql.NVarChar, insurerData.contacts[i].xtelefonocelular)
                            .input('xemail', sql.NVarChar, insurerData.contacts[i].xemail)
                            .input('xcargo', sql.NVarChar, insurerData.contacts[i].xcargo ? insurerData.contacts[i].xcargo : null)
                            .input('xtelefonooficina', sql.NVarChar, insurerData.contacts[i].xtelefonooficina ? insurerData.contacts[i].xtelefonooficina : null)
                            .input('xtelefonocasa', sql.NVarChar, insurerData.contacts[i].xtelefonocasa ? insurerData.contacts[i].xtelefonocasa : null)
                            .input('xfax', sql.NVarChar, insurerData.contacts[i].xfax ? insurerData.contacts[i].xfax : null)
                            .input('bnotificacion', sql.Bit, insurerData.contacts[i].bnotificacion)
                            .input('cusuariocreacion', sql.Int, insurerData.cusuariocreacion)
                            .input('fcreacion', sql.DateTime, new Date())
                            .query('insert into TRCONTACTOASEGURADORA (CASEGURADORA, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XTELEFONOOFICINA, XTELEFONOCASA, XFAX, BNOTIFICACION, CUSUARIOCREACION, FCREACION) values (@caseguradora, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xtelefonooficina, @xtelefonocasa, @xfax, @bnotificacion, @cusuariocreacion, @fcreacion)')
                    }
                }
                //sql.close();
                return { result: query };
            }else{
                //sql.close();
                return { result: result };
            }
        }catch(err){
            return { error: err.message };
        }
    },
    getInsurerDataQuery: async(insurerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                .input('ccompania', sql.Int, insurerData.ccompania)
                .input('caseguradora', sql.Int, insurerData.caseguradora)
                .query('select * from TRASEGURADORA where CASEGURADORA = @caseguradora and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getInsurerContactsDataQuery: async(caseguradora) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('caseguradora', sql.Int, caseguradora)
                .query('select * from TRCONTACTOASEGURADORA where CASEGURADORA = @caseguradora');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyInsurerIdentificationToUpdateQuery: async(insurerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                .input('ccompania', sql.Int, insurerData.ccompania)
                .input('caseguradora', sql.Int, insurerData.caseguradora)
                .input('ctipodocidentidad', sql.Int, insurerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, insurerData.xdocidentidad)
                .query('select * from TRASEGURADORA where XDOCIDENTIDAD = @xdocidentidad and CTIPODOCIDENTIDAD = @ctipodocidentidad and CPAIS = @cpais and CCOMPANIA = @ccompania and CASEGURADORA != @caseguradora');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateInsurerQuery: async(insurerData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), insurerData.cpais)
                .input('ccompania', sql.Int, insurerData.ccompania)
                .input('caseguradora', sql.Int, insurerData.caseguradora)
                .input('xaseguradora', sql.NVarChar, insurerData.xaseguradora)
                .input('xrepresentante', sql.NVarChar, insurerData.xrepresentante)
                .input('ctipodocidentidad', sql.Int, insurerData.ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, insurerData.xdocidentidad)
                .input('cestado', sql.Int, insurerData.cestado)
                .input('cciudad', sql.Int, insurerData.cciudad)
                .input('xdireccionfiscal', sql.NVarChar, insurerData.xdireccionfiscal)
                .input('xemail', sql.NVarChar, insurerData.xemail)
                .input('xtelefono', sql.NVarChar, insurerData.xtelefono ? insurerData.xtelefono : null)
                .input('bnotificacionsms', sql.Bit, insurerData.bnotificacionsms)
                .input('xpaginaweb', sql.NVarChar, insurerData.xpaginaweb ? insurerData.xpaginaweb : null)
                .input('bactivo', sql.Bit, insurerData.bactivo)
                .input('cusuariomodificacion', sql.Int, insurerData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update TRASEGURADORA set XASEGURADORA = @xaseguradora, XREPRESENTANTE = @xrepresentante, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCIONFISCAL = @xdireccionfiscal, XEMAIL = @xemail, XTELEFONO = @xtelefono, BNOTIFICACIONSMS = @bnotificacionsms, XPAGINAWEB = @xpaginaweb, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CASEGURADORA = @caseguradora and CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createContactsByInsurerUpdateQuery: async(contacts, insurerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let insert = await pool.request()
                    .input('caseguradora', sql.Int, insurerData.caseguradora)
                    .input('xnombre', sql.NVarChar, contacts[i].xnombre)
                    .input('xapellido', sql.NVarChar, contacts[i].xapellido)
                    .input('ctipodocidentidad', sql.Int, contacts[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, contacts[i].xdocidentidad)
                    .input('xtelefonocelular', sql.NVarChar, contacts[i].xtelefonocelular)
                    .input('xemail', sql.NVarChar, contacts[i].xemail)
                    .input('xcargo', sql.NVarChar, contacts[i].xcargo ? contacts[i].xcargo : null)
                    .input('xfax', sql.NVarChar, contacts[i].xfax ? contacts[i].xfax : null)
                    .input('xtelefonooficina', sql.NVarChar, contacts[i].xtelefonooficina ? contacts[i].xtelefonooficina : null)
                    .input('xtelefonocasa', sql.NVarChar, contacts[i].xtelefonocasa ? contacts[i].xtelefonocasa : null)
                    .input('bnotificacion', sql.Bit, contacts[i].bnotificacion)
                    .input('cusuariocreacion', sql.Int, insurerData.cusuariomodificacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRCONTACTOASEGURADORA (CASEGURADORA, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XFAX, XTELEFONOOFICINA, XTELEFONOCASA, BNOTIFICACION, CUSUARIOCREACION, FCREACION) values (@caseguradora, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xfax, @xtelefonooficina, @xtelefonocasa, @bnotificacion, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateContactsByInsurerUpdateQuery: async(contacts, insurerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let update = await pool.request()
                    .input('caseguradora', sql.Int, insurerData.caseguradora)
                    .input('ccontacto', sql.Int, contacts[i].ccontacto)
                    .input('xnombre', sql.NVarChar, contacts[i].xnombre)
                    .input('xapellido', sql.NVarChar, contacts[i].xapellido)
                    .input('ctipodocidentidad', sql.Int, contacts[i].ctipodocidentidad)
                    .input('xdocidentidad', sql.NVarChar, contacts[i].xdocidentidad)
                    .input('xtelefonocelular', sql.NVarChar, contacts[i].xtelefonocelular)
                    .input('xemail', sql.NVarChar, contacts[i].xemail)
                    .input('xcargo', sql.NVarChar, contacts[i].xcargo ? contacts[i].xcargo : null)
                    .input('xfax', sql.NVarChar, contacts[i].xfax ? contacts[i].xfax : null)
                    .input('xtelefonooficina', sql.NVarChar, contacts[i].xtelefonooficina ? contacts[i].xtelefonooficina : null)
                    .input('xtelefonocasa', sql.NVarChar, contacts[i].xtelefonocasa ? contacts[i].xtelefonocasa : null)
                    .input('bnotificacion', sql.Bit, contacts[i].bnotificacion)
                    .input('cusuariomodificacion', sql.Int, insurerData.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('update TRCONTACTOASEGURADORA set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XTELEFONOCELULAR = @xtelefonocelular, XEMAIL = @xemail, XCARGO = @xcargo, XFAX = @xfax, XTELEFONOOFICINA = @xtelefonooficina, XTELEFONOCASA = @xtelefonocasa, BNOTIFICACION = @bnotificacion, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONTACTO = @ccontacto and CASEGURADORA = @caseguradora');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    deleteContactsByInsurerUpdateQuery: async(contacts, insurerData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < contacts.length; i++){
                let erase = await pool.request()
                    .input('caseguradora', sql.Int, insurerData.caseguradora)
                    .input('ccontacto', sql.Int, contacts[i].ccontacto)
                    .query('delete from TRCONTACTOASEGURADORA where CCONTACTO = @ccontacto and CASEGURADORA = @caseguradora');
                rowsAffected = rowsAffected + erase.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    insurerValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CASEGURADORA, XASEGURADORA, BACTIVO from TRASEGURADORA where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    generalStatusByModuleValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cmodulo', sql.Int, searchData.cmodulo)
                .query('select CESTATUSGENERAL, XESTATUSGENERAL from VWBUSCARESTATUSGENERALXMODULOXPROCESODATA where CPAIS = @cpais and CCOMPANIA = @ccompania and CMODULO = @cmodulo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getDefaultGeneralStatusQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cmodulo', sql.Int, searchData.cmodulo)
                .input('bdefault', sql.Bit, true)
                .query('select CESTATUSGENERAL from VWBUSCARESTATUSGENERALXMODULOXPROCESODATA where CPAIS = @cpais and CCOMPANIA = @ccompania and CMODULO = @cmodulo and BDEFAULT = @bdefault and CMODULODEFAULT = @cmodulo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getClientCollectionOrderFleetContractDataQuery: async(ccliente, searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ccliente', sql.Int, ccliente)
                .input('ifacturacion', sql.NChar, 'G')
                .input('bactivo', sql.Bit, true)
                .query('select * from ADSOLICITUDCOBROCONTRATOFLOTA where CPAIS = @cpais and CCOMPANIA = @ccompania and CCLIENTE = @ccliente and IFACTURACION = @ifacturacion and BACTIVO = @bactivo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createSuscriptionByFleetContractCreateQuery: async(csolicitudcobrocontratoflota, ccontratoflota, fleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('csolicitudcobrocontratoflota', sql.NVarChar, csolicitudcobrocontratoflota)
                .input('ccontratoflota', sql.Int, ccontratoflota)
                .input('cusuariocreacion', sql.Int, fleetContractData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into ADSUSCRIPCIONSOLICITUDCOBROCONTRATOFLOTA (CSOLICITUDCOBROCONTRATOFLOTA, CCONTRATOFLOTA, CUSUARIOCREACION, FCREACION) values (@csolicitudcobrocontratoflota, @ccontratoflota, @cusuariocreacion, @fcreacion)');
                //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCollectionOrderFleetContractQuery: async(collectionOrderFleetContractData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, collectionOrderFleetContractData.cpais)
                .input('ccompania', sql.Numeric(4,0), collectionOrderFleetContractData.ccompania)
                .input('ccliente', sql.Int, collectionOrderFleetContractData.ccliente)
                .input('ifacturacion', sql.NChar, collectionOrderFleetContractData.ifacturacion)
                .input('cestatusgeneral', sql.Int, collectionOrderFleetContractData.cestatusgeneral)
                .input('bactivo', sql.Bit, collectionOrderFleetContractData.bactivo)
                .input('cusuariocreacion', sql.Int, collectionOrderFleetContractData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into ADSOLICITUDCOBROCONTRATOFLOTA (CCLIENTE, IFACTURACION, CESTATUSGENERAL, BACTIVO, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) output inserted.CSOLICITUDCOBROCONTRATOFLOTA values (@ccliente, @ifacturacion, @cestatusgeneral, @bactivo, @cpais, @ccompania, @cusuariocreacion, @fcreacion)');
                //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchCoinQuery: async(searchData) => {
        try{
            let query = `select * from MAMONEDAS`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getCoinDataQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from MAMONEDAS');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchClausesQuery: async(searchData) => {
        try{
            let query = `select * from MAANEXO WHERE BACTIVO = @bactivo${ searchData.xanexo ? " and XANEXO = @xanexo" : '' } `;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('bactivo', sql.Bit, 1)
                .input('xanexo', sql.NVarChar, searchData.xanexo ? searchData.xanexo: undefined)
                //.input('xclausulas', sql.NVarChar, searchData.xclausulas ? searchData.xclausulas: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getExhibitDataQuery: async(exhibitData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('canexo', sql.Int, exhibitData.canexo)
                .query('select * from MAANEXO where CANEXO = @canexo AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    getSearchExhibitDataQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('canexo', sql.Int, searchData.canexo)
                .query('select * from MAANEXO where CANEXO = @canexo AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },

    createClausesByClausesUpdateQuery: async(clausesCreateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < clausesCreateList.length; i++){
                let insert = await pool.request()
                    .input('canexo', sql.Int, clausesCreateList[i].canexo)
                    .input('xclausulas', sql.NVarChar, clausesCreateList[i].xclausulas)
                    .input('xobservacion', sql.NVarChar, clausesCreateList[i].xobservacion)
                    .input('xobjetivo', sql.NVarChar, clausesCreateList[i].xobjetivo)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into MACLAUSULAS (CANEXO, XCLAUSULAS, XOBSERVACION, XOBJETIVO, FCREACION, BACTIVO) values (@canexo, @xclausulas, @xobservacion, @xobjetivo, @fcreacion, 1)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getClausesDataQuery: async(canexo) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('canexo', sql.Int, canexo)
                .query('select * from VWBUSCARCLAUSULASXANEXO where CANEXO = @canexo order by canexo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getSearchClausesDataQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cclausula', sql.Int, searchData.cclausula)
                .query('select * from VWBUSCARCLAUSULASXANEXO where CCLAUSULA = @cclausula AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    clausesByValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('canexo', sql.Int, searchData.canexo)
                .query('select * from MACLAUSULAS WHERE CANEXO = @canexo');
            //sql.close();

            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    createObjetivesByClausesUpdateQuery: async(objetivesCreateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < objetivesCreateList.length; i++){
                let insert = await pool.request()
                    .input('cclausula', sql.Int, objetivesCreateList[i].cclausula)
                    .input('xobjetivo', sql.NVarChar, objetivesCreateList[i].xobjetivo)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into MAOBJETIVOS (CCLAUSULA, XOBJETIVO, FCREACION, BACTIVO) values (@cclausula, @xobjetivo, @fcreacion, 1)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateObjetivesByClausesUpdateQuery: async(objetivesUpdateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < objetivesUpdateList.length; i++){
                let update = await pool.request()
                .input('cobjetivo', sql.Int, objetivesUpdateList[i].cobjetivo)
                .input('cclausula', sql.Int, objetivesUpdateList[i].cclausula)
                .input('xobjetivo', sql.NVarChar, objetivesUpdateList[i].xobjetivo)
                .query('update MAOBJETIVOS set CCLAUSULA = @cclausula, XOBJETIVO = @xobjetivo, BACTIVO = 1 WHERE COBJETIVO = @cobjetivo');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getObjetivesDataQuery: async(clausesData) => {
        try{
            let query = `select * from VWBUSCAROBJETIVOSXCLAUSULAS WHERE BACTIVO = 1${ clausesData.cclausula ? " and CCLAUSULA = @cclausula" : '' }${ clausesData.canexo ? " and CANEXO = @canexo" : '' } `;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cclausula', sql.Int, clausesData.cclausula ? clausesData.cclausula: undefined)
                .input('canexo', sql.Int, clausesData.canexo ? clausesData.canexo: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getObjetivesClausesDataQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cobjetivo', sql.Int, searchData.cobjetivo)
                .query('select * from VWBUSCAROBJETIVOSXCLAUSULAS where COBJETIVO = @cobjetivo AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    replacementByValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, searchData.cnotificacion)
                .query('select * from VWBUSCARREPUESTOXNOTIFICACIONDATA WHERE CNOTIFICACION = @cnotificacion');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    serviceOrderByValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, searchData.cnotificacion)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA WHERE CNOTIFICACION = @cnotificacion AND CESTATUSGENERAL = 13');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createSettlementByNotificationQuery: async(settlementCreate, notificationData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            
            let update = await pool.request()
            .input('cnotificacion', sql.Int, notificationData.cnotificacion)
            .input('ccompania', sql.Int, notificationData.ccompania)
            .input('xobservacion', sql.NVarChar, settlementCreate.xobservacion)
            .input('xdanos', sql.NVarChar, settlementCreate.xdanos)
            .input('mmontofiniquito', sql.Numeric(17, 2), settlementCreate.mmontofiniquito)
            .input('cmoneda', sql.Int, settlementCreate.cmoneda)
            .input('ccausafiniquito', sql.Int, settlementCreate.ccausafiniquito)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into EVFINIQUITO (CNOTIFICACION, FCREACION, XOBSERVACION, XDANOS, MMONTOFINIQUITO, CMONEDA, CCAUSAFINIQUITO, CCOMPANIA, BACTIVO) values (@cnotificacion, @fcreacion, @xobservacion, @xdanos, @mmontofiniquito, @cmoneda, @ccausafiniquito, @ccompania, 1)');
            rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected, corden: settlementCreate.corden } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    searchCollectionsQuery: async(searchData) => {
        try{
            let query = `select * from MARECAUDOS WHERE BACTIVO = @bactivo AND CCOMPANIA = @ccompania${ searchData.crecaudo ? " and CRECAUDO = @crecaudo" : '' } `;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('bactivo', sql.Bit, 1)
                .input('crecaudo', sql.Int, searchData.crecaudo ? searchData.crecaudo: undefined)
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('ctiponotificacion', sql.Int, searchData.ctiponotificacion ? searchData.ctiponotificacion: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createCollectionsQuery: async(collectionsData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('xrecaudo', sql.NVarChar, collectionsData.xrecaudo)
                .input('ctiponotificacion', sql.Int, collectionsData.ctiponotificacion)
                .input('bactivo', sql.Bit, collectionsData.bactivo)
                .input('ccompania', sql.Int, collectionsData.ccompania)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MARECAUDOS (XRECAUDO, CTIPONOTIFICACION, CCOMPANIA ,FCREACION, BACTIVO) output inserted.CRECAUDO values (@xrecaudo, @ctiponotificacion, @ccompania, @fcreacion, @bactivo)');
                return { result: result };
            }catch(err){
            return { error: err.message };
        }
    },
    detailCollectionsQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecaudo', sql.Int, searchData.crecaudo)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from VWBUSCARRECAUDOXTIPONOTI WHERE CRECAUDO = @crecaudo AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    collectionsQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecaudo', sql.Int, searchData.crecaudo)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from MARECAUDOS WHERE CRECAUDO = @crecaudo AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCollectionsByCollectionsUpdateQuery: async(collectionUpdateList, collectionsData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < collectionUpdateList.length; i++){
                let update = await pool.request()
                .input('crecaudo', sql.Int, collectionsData.crecaudo)
                .input('xrecaudo', sql.NVarChar, collectionsData.xrecaudo)
                .input('bactivo', sql.Bit, collectionsData.bactivo)
                .query('update MARECAUDOS set BACTIVO = @bactivo, XRECAUDO = @xrecaudo WHERE CRECAUDO = @crecaudo');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    createDocumentsByCollectionsUpdateQuery: async(documentCreateList, collectionsData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documentCreateList.length; i++){
                let insert = await pool.request()
                    .input('crecaudo', sql.Int, documentCreateList[i].crecaudo)
                    .input('xdocumentos', sql.NVarChar, documentCreateList[i].xdocumentos)
                    .input('ccompania', sql.Int, collectionsData.ccompania)
                    .input('bactivo', sql.Bit, documentCreateList[i].bactivo)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into MADOCUMENTOS (CRECAUDO, XDOCUMENTOS, CCOMPANIA, BACTIVO, FCREACION) values (@crecaudo, @xdocumentos, @ccompania, @bactivo, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateDocumentByCollectionsUpdateQuery: async(documentUpdateList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < documentUpdateList.length; i++){
                let update = await pool.request()
                .input('cdocumento', sql.Int, documentUpdateList[i].cdocumento)
                .input('xdocumentos', sql.NVarChar, documentUpdateList[i].xdocumentos)
                .input('bactivo', sql.Bit, documentUpdateList[i].bactivo)
                .query('update MADOCUMENTOS set XDOCUMENTOS = @xdocumentos, BACTIVO = @bactivo WHERE CDOCUMENTO = @cdocumento');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    detailDocumentsQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecaudo', sql.Int, searchData.crecaudo)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from MADOCUMENTOS WHERE CRECAUDO = @crecaudo AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchDocumentsQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cdocumento', sql.Int, searchData.cdocumento)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from VWBUSCARDOCUMENTOSXRECAUDOS WHERE CDOCUMENTO = @cdocumento AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateServiceOrderBySettlementUpdateQuery: async(corden, cestatusgeneral) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);

                let update = await pool.request()
                .input('corden', sql.Int, corden)
                .input('cestatusgeneral', sql.Int, cestatusgeneral)
                .query('update EVORDENSERVICIO set CESTATUSGENERAL = @cestatusgeneral WHERE CORDEN = @corden');
                rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    detailSettlementQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cfiniquito', sql.Int, searchData.cfiniquito)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from VWBUSCARFINIQUITO WHERE CFINIQUITO = @cfiniquito AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    TypeVehicleArysVialByValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccompania', sql.Int, searchData.ccompania)
                .input('cpais', sql.Int, searchData.cpais)
                .query('select * from VWBUSCARCONDICIONESARYSVIAL WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchArysVialQuery: async(searchData) => {
        try{
            let query = `SELECT * FROM VWBUSCARCONDICIONESARYSVIAL WHERE BACTIVO = @bactivo AND CCOMPANIA = @ccompania${ searchData.ctipovehiculo ? " and CTIPOVEHICULO = @ctipovehiculo" : '' } `;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('bactivo', sql.Bit, 1)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania: undefined)
                .input('ctipovehiculo', sql.Int, searchData.ctipovehiculo ? searchData.ctipovehiculo: undefined)
                //.input('xclausulas', sql.NVarChar, searchData.xclausulas ? searchData.xclausulas: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    getVehicleTypeDataQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, searchData.cpais)
                .query('select * from VWBUSCARTIPOVEHICULOXTARIFAS where CPAIS = @cpais AND BACTIVO = 1');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateVehicleTypeQuery: async(vehicleTypeUpdate, searchdata) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < vehicleTypeUpdate.length; i++){
                let update = await pool.request()
                .input('ctipovehiculo', sql.Int, vehicleTypeUpdate[i].ctipovehiculo)
                .input('mtarifa', sql.Numeric(18,2), vehicleTypeUpdate[i].mtarifa)
                .input('ncantidad', sql.Numeric(4, 0), vehicleTypeUpdate[i].ncantidad)
                .input('mcoberturamax', sql.Numeric(18,2), vehicleTypeUpdate[i].mcoberturamax)
                .input('cmoneda', sql.Int, vehicleTypeUpdate[i].cmoneda)
                .input('cpais', sql.Int, searchdata.cpais)
                .query('update MATIPOVEHICULO set MTARIFA = @mtarifa, NCANTIDAD = @ncantidad, MCOBERTURAMAX = @mcoberturamax, CMONEDA = @cmoneda WHERE CTIPOVEHICULO = @ctipovehiculo AND CPAIS = @cpais');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
        return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    getVehicleTypeRowDataQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, searchData.cpais)
                .input('ctipovehiculo', sql.Int, searchData.ctipovehiculo)
                .query('select * from VWBUSCARTIPOVEHICULOXTARIFAS where CPAIS = @cpais AND BACTIVO = 1 AND CTIPOVEHICULO = @ctipovehiculo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    verifyUserClubNameToCreateQuery: async(userData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), userData.cpais ? userData.cpais: 58)
                .input('cestado', sql.Int, userData.cestado)
                .input('xciudad', sql.NVarChar, userData.xciudad)
                .query('select * from MACIUDAD where XCIUDAD = @xciudad and CESTADO = @cestado and CPAIS = @cpais');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    createUserClubQuery: async(userData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            
                let insert = await pool.request()
                    .input('xnombre', sql.NVarChar, userData.xnombre)
                    .input('xapellido', sql.NVarChar, userData.xapellido)
                    .input('csexo', sql.Int, userData.csexo)
                    .input('fnacimiento', sql.DateTime, userData.fnacimiento)
                    .input('xemail', sql.NVarChar, userData.xemail)
                    .input('xcontrasena', sql.NVarChar, userData.xcontrasena)
                    .input('cciudad', sql.Int, userData.cciudad)
                    .input('cestado', sql.Int, userData.cestado)
                    .input('xdocidentidad', sql.NVarChar, userData.xdocidentidad)
                    .input('xtelefonocelular', sql.NVarChar, userData.xtelefonocelular)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TMEMISION_USUARIO (XNOMBRE, XAPELLIDO, CSEXO, FNACIMIENTO, XEMAIL, XCONTRASENA, CCIUDAD, CESTADO, XDOCIDENTIDAD, XTELEFONOCELULAR, FCREACION) values (@xnombre, @xapellido, @csexo, @fnacimiento, @xemail, @xcontrasena, @cciudad, @cestado, @xdocidentidad, @xtelefonocelular, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
            
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    DataCreateAgendaClient: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpropietario', sql.Int, DataAgenda.cpropietario)
                .input('xtitulo', sql.NVarChar, DataAgenda.xtitulo)
                .input('fdesde', sql.DateTime, DataAgenda.fdesde)
                .input('fhasta', sql.DateTime, DataAgenda.fhasta)
                .input('xcondicion', sql.Bit, DataAgenda.condicion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into TRAGENDA (CPROPIETARIO, XTITULO, FDESDE, FHASTA, XCONDICION, FCREACION, CUSUARIOMODIFICACION, BACTIVO) values (@cpropietario,@xtitulo, @fdesde, @fhasta, @xcondicion, @fcreacion, @cpropietario , 1)');
                if(result.rowsAffected > 0){
                let query = await pool.request()
                    .input('cpropietario', sql.Int, DataAgenda.cpropietario)
                    .query('SELECT * FROM TRAGENDA  where CPROPIETARIO = @cpropietario and BACTIVO = 1');

                return { result: query };
            }else{
                return { result: result };
                
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    UploadDocAgendaClient: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let upload = await pool.request()
                .input('cpropietario', sql.Int, DataAgenda.cpropietario)
                .input('xarchivo', sql.NVarChar, DataAgenda.xarchivo)
                .input('itipodocumento', sql.NVarChar, DataAgenda.itipodocumento)
                .input('fvencimiento', sql.Date, DataAgenda.fvencimiento)
                .input('cusuariocreacion', sql.Bit, DataAgenda.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MADOCPROPIETARIO (CPROPIETARIO, XRUTA, ITIPODOCUMENTO, FVENCIMIENTO, CUSUARIOCREACION, FCREACION) values (@cpropietario,@xarchivo, @itipodocumento, @fvencimiento, @cusuariocreacion,@fcreacion )');
                if(upload.rowsAffected > 0){
                    let pool = await sql.connect(config);
                    let uploadagend = await pool.request()
                    .input('cpropietario', sql.Int, DataAgenda.cpropietario)
                    .input('itipodocumento', sql.NVarChar, ('Renovacion de '+DataAgenda.itipodocumento) )
                    .input('fvencimiento', sql.Date, DataAgenda.fvencimiento)
                    .input('cusuariocreacion', sql.Bit, DataAgenda.cusuariocreacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRAGENDA (CPROPIETARIO, XTITULO, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@cpropietario, @itipodocumento, @fvencimiento, @fvencimiento, @cusuariocreacion,@fcreacion )');
                    if(uploadagend.rowsAffected > 0){
                        let query = await pool.request()
                            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
                            .query('SELECT * FROM MADOCPROPIETARIO  where CPROPIETARIO = @cpropietario');
        
                        return { result: query };
                    
                }
                }else{
                return { result: result };
                
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    UploadDocAgendaClient: async(DataDocAgend) => {
        try{
            let pool = await sql.connect(config);
            let upload = await pool.request()
                .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
                .input('xarchivo', sql.NVarChar, DataDocAgend.xarchivo)
                .input('itipodocumento', sql.NVarChar, DataDocAgend.itipodocumento)
                .input('fvencimiento', sql.Date, DataDocAgend.fvencimiento)
                .input('cusuariocreacion', sql.Bit, DataDocAgend.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into MADOCPROPIETARIO (CPROPIETARIO, XRUTA, ITIPODOCUMENTO, FVENCIMIENTO, CUSUARIOCREACION, FCREACION) values (@cpropietario,@xarchivo, @itipodocumento, @fvencimiento, @cusuariocreacion,@fcreacion )');
                if(upload.rowsAffected > 0){
                    let pool = await sql.connect(config);
                    let uploadagend = await pool.request()
                    .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
                    .input('itipodocumento', sql.NVarChar, ('Renovacion de '+DataDocAgend.itipodocumento) )
                    .input('fvencimiento', sql.Date, DataDocAgend.fvencimiento)
                    .input('cusuariocreacion', sql.Bit, DataDocAgend.cusuariocreacion)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRAGENDA (CPROPIETARIO, XTITULO, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@cpropietario, @itipodocumento, @fvencimiento, @fvencimiento, @cusuariocreacion,@fcreacion )');
                    if(uploadagend.rowsAffected > 0){
                        let query = await pool.request()
                            .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
                            .query('SELECT * FROM MADOCPROPIETARIO  where CPROPIETARIO = @cpropietario');
        
                        return { result: query };
                    
                }
                }else{
                return { result: result };
                
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    UploadManAgendaClient: async(DataDocAgend) => {
        try{
            let pool = await sql.connect(config);
            let upload = await pool.request()
            .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
            .input('xmantenimientoCorrect', sql.NVarChar,DataDocAgend.xmantenimientoCorrect )
            .input('fdesde', sql.DateTime, DataDocAgend.fdesde )
            .input('cusuariocreacion', sql.Bit, DataDocAgend.cpropietario)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into TRAGENDA (CPROPIETARIO, XTITULO, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@cpropietario, @xmantenimientoCorrect, @fdesde,@fdesde, @cusuariocreacion,@fcreacion )');
                    if(upload.rowsAffected > 0){
                    let pool = await sql.connect(config);
                    let uploadagend = await pool.request()
                    .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
                    .input('xmantenimientoPrevent', sql.NVarChar,DataDocAgend.xmantenimientoPrevent )
                    .input('fdesde', sql.DateTime, DataDocAgend.fdesde )
                    .input('cusuariocreacion', sql.Bit, DataDocAgend.cpropietario)
                    .input('fcreacion', sql.DateTime, new Date())
                    .query('insert into TRAGENDA (CPROPIETARIO, XTITULO, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@cpropietario, @xmantenimientoPrevent, @fdesde, @fdesde, @cusuariocreacion,@fcreacion )');
                    if(uploadagend.rowsAffected > 0){
                        let query = await pool.request()
                            .input('cpropietario', sql.Int, DataDocAgend.cpropietario)
                            .query('SELECT * FROM TRAGENDA  where CPROPIETARIO = @cpropietario and BACTIVO = 1');
        
                        return { result: query };
                    
                }
                }else{
                return { result: result };
                
            }
        }catch(err){
;
            return { error: err.message };
        }
    },
    DataAgendaClientSolicitud: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
            .query('SELECT FCREACION,CSOLICITUDSERVICIO,XSERVICIO FROM VWBUSCARSOLICITUDSERVICIODATA  where CPROPIETARIO = @cpropietario');
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    DataAgendaClient: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
            .query('SELECT * FROM TRAGENDA  where CPROPIETARIO = @cpropietario and BACTIVO = 1');
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    BirthdayClient: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
            .query('SELECT * FROM TRPROPIETARIO  where CPROPIETARIO = @cpropietario');
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    CountAgendaClient: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
            .query('select COUNT(CSOLICITUDSERVICIO) AS CSOLICITUDSERVICIO  from VWBUSCARSOLICITUDSERVICIODATA  where CPROPIETARIO = @cpropietario');
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    UpdateAgenda: async(DataAgenda) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cpropietario', sql.Int, DataAgenda.cpropietario)
            .input('id', sql.Int, DataAgenda.id)
            .query('update TRAGENDA set BACTIVO = 0 WHERE CPROPIETARIO = @cpropietario and ID = @id');
            return { result: result };
        }catch(err){

            return { error: err.message };
        }
    },
    sexValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from MASEXO');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    ClienDataClubVehicle: async(ClientData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), ClientData.cpais)
            .input('cpropietario', sql.Int, ClientData.cpropietario)
            .query('select * from VWBUSCARSUCONTRATOFLOTADATA where CPROPIETARIO = @cpropietario ');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
    },
    ClienDataClub: async(ClientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ClientData.cpais)
                .input('cpropietario', sql.Int, ClientData.cpropietario)
                .query('select * from TRPROPIETARIO where CPROPIETARIO = @cpropietario ');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    ClienDataClubPlan: async(ClientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), ClientData.cpais)
                .input('cpropietario', sql.Int, ClientData.cpropietario)
                .query('select * from VWBUSCARDATACLIENTCLUB where CPROPIETARIO = @cpropietario ');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    ClienDataClubPlanService: async(ClientData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ctiposervicio', sql.Int, ClientData.ctiposervicio)
            .input('ccontratoflota', sql.Int, ClientData.ccontratoflota)
            .query('select * from VWBUSCARSERVICIOSPARACLUB where CTIPOSERVICIO = @ctiposervicio AND CCONTRATOFLOTA = @ccontratoflota');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
    },
    ClienDataProveedor: async(ClientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cestado', sql.Int, ClientData.cestado)
                .input('cciudad', sql.Int, ClientData.cciudad)
                .input('cservicio', sql.Int, ClientData.cservicio)
                .query('select * from VWBUSCARPROVEEDORESXSERVICIOS where CESTADO= @cestado and CCIUDAD= @cciudad AND CSERVICIO= @cservicio');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    SolicitudServiceClub: async(ClientData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, ClientData.cpais)
                .input('cestado', sql.Int, ClientData.cestado)
                .input('cciudad', sql.Int, ClientData.cciudad)
                .input('cservicio', sql.Int, ClientData.cservicio)
                .input('ctiposervicio', sql.Int, ClientData.ctiposervicio)
                .input('cproveedor', sql.Int, ClientData.cproveedor)
                .input('fsolicitud', sql.DateTime, ClientData.fsolicitud)
                .input('cpropietario', sql.Int, ClientData.cpropietario)
                .input('ccontratoflota', sql.Int, ClientData.ccontratoflota)
                .input('isolicitante', sql.NVarChar, 'USR')
                .input('fcreacion', sql.DateTime, new Date())
                .query('INSERT INTO evsolicitudservicio (CPAIS, CESTADO,CCIUDAD,CSERVICIO,CTIPOSERVICIO,CPROVEEDOR,CPROPIETARIO,ISOLICITANTE,CCONTRATOFLOTA,FCREACION, FSOLICITUD) VALUES(@cpais,@cestado,@cciudad,@cservicio,@ctiposervicio,@cproveedor, @cpropietario,@isolicitante,@ccontratoflota, @fcreacion, @fsolicitud)');
            //sql.close();
            return { result: result };
        }catch(err){
            console.error(err);
            return { error: err.message };
        }
    },
    cancellationCauseServiceOrderValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CCAUSAANULACION, XCAUSAANULACION, BACTIVO from MACAUSAANULACION where CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    generalStatusServiceOrderValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select CESTATUSGENERAL, XESTATUSGENERAL, BACTIVO from MAESTATUSGENERAL where CESTATUSGENERAL in (3, 4, 5, 7, 13, 19) AND CPAIS = @cpais and CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPendingPaymentsQuery: async(searchData, cestatusgeneral) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('fdesde', sql.Date, searchData.fdesde)
                .input('fhasta', sql.Date, searchData.fhasta)
                .input('cestatusgeneral', sql.Int, cestatusgeneral)
                .input('factual', sql.DateTime, new Date().toJSON())
                .query('SELECT * FROM VWBUSCARPRIMASPENDIENTES WHERE CESTATUSGENERAL = @cestatusgeneral AND FDESDE_REC >= @fdesde AND FHASTA_REC <= @fhasta')
            return { result: result };
        }
        catch(err) {
            return { error: err.message };
        }
    },
    searchCollectionQuery: async(searchData) => {
        try{
            let query = `SELECT * FROM VWBUSCARRECIBOSPENDIENTES WHERE CESTATUSGENERAL = @cestatusgeneral AND CCOMPANIA = @ccompania${ searchData.xplaca ? " and XPLACA = @xplaca" : '' } ${ searchData.ccorredor ? " and CCORREDOR = @ccorredor" : '' } ${ searchData.ccanal ? " and CCANAL = @ccanal" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cestatusgeneral', sql.Int, 13)
                .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania: undefined)
                .input('xplaca', sql.NVarChar, searchData.xplaca ? searchData.xplaca: undefined)
                .input('ccorredor', sql.Int, searchData.ccorredor ? searchData.ccorredor: undefined)
                .input('ccanal', sql.Int, searchData.ccanal ? searchData.ccanal: undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    detailCollectionQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('crecibo', sql.Int, searchData.crecibo)
                .query('select * from VWBUSCARRECIBO where CRECIBO = @crecibo');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updateCollectionQuery: async(collectionDataList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('crecibo', sql.Int, collectionDataList.crecibo)
            .input('ctipopago', sql.Int, collectionDataList.ctipopago)
            .input('cbanco', sql.Int, collectionDataList.cbanco)
            .input('xreferencia', sql.NVarChar, collectionDataList.xreferencia)
            .input('fcobro', sql.DateTime, collectionDataList.fcobro)
            .input('mprima_pagada', sql.Numeric(17,2), collectionDataList.mprima_pagada)
            .input('ccompania', sql.Int, collectionDataList.ccompania)
            .input('cpais', sql.Int, collectionDataList.cpais)
            .input('cestatusgeneral', sql.Int, collectionDataList.cestatusgeneral)
            .input('xnota', sql.NVarChar, collectionDataList.xnota)
            .input('cbanco_destino', sql.Int, collectionDataList.cbanco_destino)
            .input('mtasa_cambio', sql.Numeric(18,2), collectionDataList.mtasa_cambio)
            .input('ftasa_cambio', sql.DateTime, collectionDataList.ftasa_cambio)
            .input('ccanal', sql.Int, collectionDataList.ccanal)
            .query('update SURECIBO set XREFERENCIA = @xreferencia, CTIPOPAGO = @ctipopago, CBANCO = @cbanco, FCOBRO = @fcobro, MPRIMA_PAGADA = @mprima_pagada, CESTATUSGENERAL = @cestatusgeneral, XNOTA = @xnota, CBANCO_DESTINO = @cbanco_destino, MTASA_CAMBIO = @mtasa_cambio, FTASA_CAMBIO = @ftasa_cambio, CCANAL = @ccanal where CRECIBO = @crecibo AND CCOMPANIA = @ccompania AND CPAIS = @cpais');
            rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateReceiptPaymentQuery: async(paymentData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('crecibo', sql.Int, paymentData.crecibo)
            .input('ctipopago', sql.Int, paymentData.ctipopago)
            .input('xreferencia', sql.NVarChar, paymentData.xreferencia)
            .input('fcobro', sql.DateTime, paymentData.fcobro)
            .input('mprima_pagada', sql.Numeric(17,2), paymentData.mprima_pagada)
            .input('cestatusgeneral', sql.Int, 7)
            .query('update SURECIBO set XREFERENCIA = @xreferencia, CTIPOPAGO = @ctipopago, FCOBRO = @fcobro, MPRIMA_PAGADA = @mprima_pagada, CESTATUSGENERAL = @cestatusgeneral where CRECIBO = @crecibo');
            rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    updateReceiptPaymentBrokerQuery: async(paymentData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('ccontratoflota', sql.Int, paymentData.ccontratoflota)
            .input('orderId', sql.NVarChar, paymentData.orderId)
            .input('ctipopago', sql.Int, paymentData.ctipopago)
            .input('xreferencia', sql.NVarChar, paymentData.xreferencia)
            .input('fcobro', sql.DateTime, paymentData.fcobro)
            .input('mprima_pagada', sql.Numeric(17,2), paymentData.mprima_pagada)
            .input('cestatusgeneral', sql.Int, 7)
            .query('update SURECIBO set CCODIGO_UBII = @orderId, XREFERENCIA = @xreferencia, CTIPOPAGO = @ctipopago, FCOBRO = @fcobro, MPRIMA_PAGADA = @mprima_pagada, CESTATUSGENERAL = @cestatusgeneral where CRECIBO IN (SELECT TOP 1 CRECIBO FROM SURECIBO WHERE CCONTRATOFLOTA = @ccontratoflota AND CESTATUSGENERAL = 13)' );
            rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    updateFleetContractGeneralStateQuery: async(ccontratoflota) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('ccontratoflota', sql.Int, paymentData.ccontratoflota)
            .input('cestatusgeneral', sql.Int, 7)
            .query('update SUCONTRATOFLOTA set CESTATUSGENERAL = @cestatusgeneral where CCONTRATOFLOTA = @ccontratoflota')
            rowsAffected = rowsAffected + update.rowsAffected;
            return { result: { rowsAffected: rowsAffected}};
        }
        catch(err){
;
            return { error: err.message };
        }
    },
    plateValrepQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Int, searchData.cpais)
                .input('ccompania', sql.Int, searchData.ccompania)
                .query('select * from VWBUSCARRECIBOSPENDIENTES where CPAIS = @cpais AND CCOMPANIA = @ccompania');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },


    vehicleQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .query('select DISTINCT XTIPO from VWBUSCARPLANRC');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message };
        }
    },
    OverLimitvehicleQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .query('SELECT * FROM PRTARIFA_EXCESO');
            //sql.close();
            return { result: result };
        }
        catch(err){
            return { error: err.message };
        }
    },

    planRcvTypeQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('xtipo', sql.NVarChar, searchData.xtipo)
            .query('select * from VWBUSCARPLANRC where XTIPO = @xtipo ');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    planRcvTypeValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from POPLAN_RC');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    searchPlanRcvQuery: async(cplan_rc) => {
        try{
            let query = `select * from POPLAN_RC where BACTIVO = @bactivo${cplan_rc ? " and CPLAN_RC = @cplan_rc" : '' }`;
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('bactivo', sql.Bit, 1)
                .input('cplan_rc', sql.Int, cplan_rc ? cplan_rc : undefined)
                .query(query);
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    detailPlanRcvQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cplan_rc', sql.Int, searchData.cplan_rc)
                .query('select * from POPLAN_RC_DETALLE where CPLAN_RC = @cplan_rc');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    detailPlanQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cplan_rc', sql.Int, searchData.cplan_rc)
                .query('select * from POPLAN_RC where CPLAN_RC = @cplan_rc');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
    updatePlanRcvQuery: async(dataPlanRcv, planList) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < planList.length; i++){
                let update = await pool.request()
                    .input('cplan_rc', sql.Int, dataPlanRcv.cplan_rc)
                    .input('xcobertura', sql.NVarChar, planList[i].xcobertura)
                    .input('xsoat', sql.NVarChar, planList[i].xsoat)
                    .input('bactivo', sql.Bit, 1)
                    .input('cusuariomodificacion', sql.Int, dataPlanRcv.cusuariomodificacion)
                    .input('fmodificacion', sql.DateTime, new Date())
                    .query('UPDATE POPLAN_RC_DETALLE SET XSOAT = @xsoat, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion WHERE CPLAN_RC = @cplan_rc AND XCOBERTURA = @xcobertura')
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            return { result: { rowsAffected: rowsAffected } };
        }catch(err){
            return { error: err.message };
        }
    },
serviceOrderBySettlementQuery: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cnotificacion', sql.Int, searchData.cnotificacion)
                .input('xdanos', sql.NVarChar, searchData.xdanos)
                .query('select * from VWBUSCARORDENSERVICIOXFLOTA WHERE CNOTIFICACION = @cnotificacion AND CESTATUSGENERAL = 13 AND XDANOS = @xdanos');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
TypeMetodologia: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('cpais', sql.Int, searchData.cpais)
            .query('select * from MAMETODOLOGIAPAGO WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais AND BACTIVO = 1');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
 },
 SearchTarifas: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xcobertura', sql.NVarChar, searchData.xcobertura)
        .query('select PTARIFA from MATARIFA_OTROS WHERE XCOBERTURA = @xcobertura');
       return{ result: result }
    }catch(err){
        return { error: err.message };
        }
},
SearchTarifaCasco: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xtipo', sql.NVarChar, searchData.xtipo)
        .input('xmarca', sql.NVarChar, searchData.xmarca)
        .input('xmodelo', sql.NVarChar, searchData.xmodelo)
        .input('cano', sql.SmallInt, searchData.cano)
        .query('select XCLASE from MACLASIFICACION_VEH WHERE XTIPO = @xtipo AND XMARCA = @xmarca AND XMODELO = @xmodelo');
        if(result.rowsAffected > 0 ) {
            let pool = await sql.connect(config);
            let query= await pool.request()
                .input('xclase', sql.NVarChar, result.recordset[0].XCLASE)
                .input('cano', sql.Int, searchData.cano)
                .input('xtipo', sql.NVarChar, searchData.xtipo)
                .query('select PTASA_CASCO from MATARIFA_CASCO where XCLASE = @xclase AND CANO = @cano AND XTIPO = @xtipo');
                return { result: query };
        }else {
            return{result: result}
             } 
    }catch(err){
        return { error: err.message };
        }
},
SearchTarifaPerdida: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xtipo', sql.NVarChar, searchData.xtipo)
        .input('xmarca', sql.NVarChar, searchData.xmarca)
        .input('xmodelo', sql.NVarChar, searchData.xmodelo)
        .input('cano', sql.SmallInt, searchData.cano)
        .query('select XCLASE from MACLASIFICACION_VEH WHERE XTIPO = @xtipo AND XMARCA = @xmarca AND XMODELO = @xmodelo');
        if(result.rowsAffected > 0 ) {
            let pool = await sql.connect(config);
            let query= await pool.request()
                .input('xclase', sql.NVarChar, result.recordset[0].XCLASE)
                .input('cano', sql.Int, searchData.cano)
                .input('xtipo', sql.NVarChar, searchData.xtipo)
                .query('select PTASA_CASCO from MATARIFA_PERDIDA where XCLASE = @xclase AND CANO = @cano AND XTIPO = @xtipo');
                return { result: query };
       }else{
        //sql.close();
        return { result: result };
       } 
    }catch(err){
        return { error: err.message };
        }
},
ValidateTarifaCasco: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xtipo', sql.NVarChar, searchData.xtipo)
        .input('cano', sql.SmallInt, searchData.cano)
        .query('select min(CANO) from MATARIFA_CASCO WHERE XTIPO = @xtipo');
        return { result: result };
    }catch(err){
        return { error: err.message };
        }
},
ValidateTarifaPerdida: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xtipo', sql.NVarChar, searchData.xtipo)
        .input('cano', sql.SmallInt, searchData.cano)
        .query('select min(CANO) from MATARIFA_PERDIDA WHERE XTIPO = @xtipo');
        return { result: result };
    }catch(err){
        return { error: err.message };
        }
},
ValidatePLate: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('xplaca', sql.NVarChar, searchData.xplaca)
        .query('select * from SURECIBO WHERE XPLACA = @xplaca AND CESTATUSGENERAL <> 3');
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
},
getSeatchTarifaData: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from VWBUSCARTARIFA');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getRecoverageDetailData: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .input('ccobertura', sql.Int, searchData.ccobertura)
                .input('ccontratoflota', sql.Int, searchData.ccontratoflota)
                .query('select * from VWBUSCARCOBERTURASXCONTRATOFLOTA where ccontratoflota = @ccontratoflota AND CCOBERTURA = @ccobertura');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
updateCoverageQuery: async(coverageData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            for(let i = 0; i < coverageData.length; i++){
                let update = await pool.request()
                .input('ccobertura', sql.Int, coverageData[i].ccobertura)
                .input('ccontratoflota', sql.Int, coverageData[i].ccontratoflota)
                .input('mprima', sql.Numeric(17, 2), coverageData[i].mprima)
                .input('msuma_aseg', sql.Numeric(17, 2), coverageData[i].msuma_aseg)
                .query('update sucoberturas set mprima = @mprima, msuma_aseg = @msuma_aseg WHERE ccontratoflota = @ccontratoflota AND ccobertura = @ccobertura');
                rowsAffected = rowsAffected + update.rowsAffected;
            }
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
    updateCoverageTableQuery: async(coverageData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('ccobertura', sql.Int, coverageData.ccobertura)
            .input('xcobertura', sql.NVarChar, coverageData.xcobertura)
            .input('bactivo', sql.Bit, coverageData.bactivo)
            .input('cusuariomodificacion', sql.Bit, coverageData.cusuariomodificacion)
            .input('fmodificacion', sql.DateTime, new Date())
            .query('update MACOBERTURA set XCOBERTURA = @xcobertura, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion WHERE CCOBERTURA = @ccobertura');
            rowsAffected = rowsAffected + update.rowsAffected;
        
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){
            return { error: err.message };
        }
    },
updateReceiptQuery: async(fechaData) => {
        try{
            let rowsAffected = 0;
            let pool = await sql.connect(config);
            let update = await pool.request()
            .input('ccarga', sql.Int, fechaData[0].ccarga)
            .input('fdesde_pol', sql.DateTime, fechaData[0].fdesde_pol)
            .input('fhasta_pol', sql.DateTime, fechaData[0].fhasta_pol)
            .input('fdesde_rec', sql.DateTime, fechaData[0].fdesde_rec)
            .input('fhasta_rec', sql.DateTime, fechaData[0].fhasta_rec)
            .query('update SURECIBO set FDESDE_POL = @fdesde_pol, FHASTA_POL = @fhasta_pol, FDESDE_REC = @fdesde_rec, FHASTA_REC = @fhasta_rec WHERE CCARGA = @ccarga');
            rowsAffected = rowsAffected + update.rowsAffected;
            //sql.close();
            return { result: { rowsAffected: rowsAffected } };
        }
        catch(err){

            return { error: err.message };
        }
    },
causeSettlementValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
                .query('select * from MACAUSAFINIQUITO WHERE CESTATUSGENERAL = 13');
            //sql.close();
            return { result: result };
        }catch(err){
            return { error: err.message };
        }
    },
TypeMetodologia: async(searchData) => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('cpais', sql.Int, searchData.cpais)
            .query('select * from MAMETODOLOGIAPAGO WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais AND BACTIVO = 1');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createAccesoriesFromFleetContractIndividual: async(accessoryData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < accessoryData.length; i++){
            let insert = await pool.request()
                .input('caccesorio', sql.Int, accessoryData[i].caccesorio)
                .input('msuma_accesorio', sql.Numeric(18, 2), accessoryData[i].msuma_accesorio)
                .input('mprima_accesorio', sql.Numeric(18, 2), accessoryData[i].mprima_accesorio)
                .input('ptasa', sql.Numeric(18, 2), accessoryData[i].ptasa)
                .query('insert into TMACCESORIOS (CACCESORIO, MSUMA_ACCESORIO, MPRIMA_ACCESORIO, PTASA) values (@caccesorio, @msuma_accesorio, @mprima_accesorio, @ptasa)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
AddPaymentData: async(payment, userData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < payment.length; i++){
            let insert = await pool.request()
                .input('femision', sql.DateTime, userData.femision)
                .input('xserialcarroceria', sql.Int, userData.ccarga)
                .input('ctipopago', sql.Int, payment[i].ctipopago)
                .input('xreferencia', sql.Numeric(18, 2), payment[i].xreferencia)
                .input('fcobro', sql.Numeric(18, 2), payment[i].fcobro)
                .input('cbanco', sql.Numeric(18, 2), payment[i].cbanco)
                .input('mprima_pagada', sql.Numeric(18, 2), payment[i].mprima_pagada)
                .query('insert into TMEMISION_INDIVIDUAL (CTIPOPAGO, XREFERENCIA, FCOBRO, CBANCO, MPRIMA_PAGADA) values (@ctipopago, @xreferencia, @fcobro, @cbanco, @mprima_pagada) ')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
ValidateVersionDataQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cmarca', sql.Int, searchData.cmarca)
        .input('cmodelo', sql.Int, searchData.cmodelo)
        .input('cversion', sql.Int, searchData.cversion)
        .query('select * from MAVVERSION WHERE CMARCA = @cmarca AND CMODELO = @cmodelo AND CVERSION = @cversion');
    //sql.close();
    return { result: result };
}catch(err){
    return { error: err.message };
}
},
searchAdministrationPaymentRecordQuery: async(searchData) => {
    try{
        let query = `select DISTINCT CFACTURA, XCLIENTE, XNOMBRE, MMONTOFACTURA, NCONTROL, NFACTURA, FFACTURA, FRECEPCION, FVENCIMIENTO from VWBUSCARFACTURASREGISTRADAS WHERE CORDEN > 0 AND CESTATUSGENERAL = @cestatusgeneral${ searchData.ffactura ? " and FFACTURA = @ffactura" : '' }${ searchData.frecepcion ? " and FRECEPCION = @frecepcion" : '' }${ searchData.fvencimiento ? " and FVENCIMIENTO = @fvencimiento" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ffactura', sql.DateTime, searchData.ffactura ? searchData.ffactura: undefined)
            .input('frecepcion', sql.DateTime, searchData.frecepcion ? searchData.frecepcion: undefined)
            .input('fvencimiento', sql.DateTime, searchData.fvencimiento ? searchData.fvencimiento: undefined)
            .input('cestatusgeneral', sql.Int, 10)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
serviceOrderValrepQuery: async() => {
        try{
            let pool = await sql.connect(config);
            let result = await pool.request()
            .input('cestatusgeneral', sql.Int, 13)
            .query('select * from VWBUSCARORDENSERVICIOXFLOTA WHERE CESTATUSGENERAL = @cestatusgeneral AND MTOTAL > 0 OR MMONTOTOTAL > 0');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchSettlementAdministrationPaymentRecordQuery: async(searchData) => {
    try{
        let query = `select DISTINCT CFACTURA, XCLIENTE, XNOMBRE, MMONTOFACTURA, NCONTROL, NFACTURA, FFACTURA, FRECEPCION, FVENCIMIENTO from VWBUSCARFACTURASREGISTRADAS WHERE CFINIQUITO > 0 AND CESTATUSGENERAL = @cestatusgeneral${ searchData.ffactura ? " and FFACTURA = @ffactura" : '' }${ searchData.frecepcion ? " and FRECEPCION = @frecepcion" : '' }${ searchData.fvencimiento ? " and FVENCIMIENTO = @fvencimiento" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ffactura', sql.DateTime, searchData.ffactura ? searchData.ffactura: undefined)
            .input('frecepcion', sql.DateTime, searchData.frecepcion ? searchData.frecepcion: undefined)
            .input('fvencimiento', sql.DateTime, searchData.fvencimiento ? searchData.fvencimiento: undefined)
            .input('cestatusgeneral', sql.Int, 10)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
settlementValrepQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from VWBUSCARFINIQUITO WHERE MMONTOFINIQUITO > 0');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateDatesFromFleetContractQuery: async(datesList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < datesList.length; i++){
            let update = await pool.request()
            .input('ccarga', sql.Int, datesList[i].ccarga)
            .input('fdesde_pol', sql.DateTime, datesList[i].fdesde_pol)
            .input('fhasta_pol', sql.DateTime, datesList[i].fhasta_pol)
            .input('fdesde_rec', sql.DateTime, datesList[i].fdesde_rec)
            .input('fhasta_rec', sql.DateTime, datesList[i].fhasta_rec)
            .query('update SURECIBO set FDESDE_POL = @fdesde_pol, FHASTA_POL = @fhasta_pol, FDESDE_REC = @fdesde_rec, FHASTA_REC = @fhasta_rec, XANEXO = @xanexo, XOBSERVACIONES = @xobservaciones WHERE CCARGA = @ccarga');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateCoverageFromFleetContractQuery: async(coverageList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        
        let update = await pool.request()
        .input('ccobertura', sql.Int, coverageList[0].ccobertura)
        .input('ccontratoflota', sql.Int, coverageList[0].ccontratoflota)
        .input('mprima', sql.Numeric(17, 2), coverageList[0].mprima)
        .input('msuma_aseg', sql.Numeric(17, 2), coverageList[0].msuma_aseg)
        .query('update sucoberturas set mprima = @mprima, msuma_aseg = @msuma_aseg WHERE ccontratoflota = @ccontratoflota AND ccobertura = @ccobertura');
        rowsAffected = rowsAffected + update.rowsAffected;
        
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
detailCoverageQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccobertura', sql.Int, searchData.ccobertura)
            .input('ccontratoflota', sql.Int, searchData.ccontratoflota)
            .query('select * from VWBUSCARCOBERTURASXCONTRATOFLOTA WHERE CCOBERTURA = @ccobertura and ccontratoflota = @ccontratoflota');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateExtras: async(extraList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let update = await pool.request()
            .input('ccontratoflota', sql.NVarChar, extraList[0].ccontratoflota)
            .input('xanexo', sql.NVarChar, extraList[0].xanexo)
            .input('xobservaciones', sql.NVarChar, extraList[0].xobservaciones)
            .query('update SUCONTRATOFLOTA set XANEXO = @xanexo, XOBSERVACIONES = @xobservaciones WHERE CCONTRATOFLOTA = @ccontratoflota');
            rowsAffected = rowsAffected + update.rowsAffected;
        
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
providerQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .query('select * from PRPROVEEDORES WHERE CPAIS = @cpais AND CCOMPANIA = @ccompania');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
providerFromBillLoadingQuery: async(cproveedor) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cproveedor', sql.Int, cproveedor)
            .query('select * from PRPROVEEDORES WHERE CPROVEEDOR = @cproveedor');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchBrokerQuery: async(searchData) => {
    try{
        let query = `select * from MACORREDORES WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getUserBrokerDataQuery: async(ccorredor, cpais, ccompania) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), cpais)
            .input('ccompania', sql.Int, ccompania)
            .input('ccorredor', sql.Int, ccorredor)
            .query('select * from MACORREDORES where CCORREDOR = @ccorredor and CPAIS = @cpais and CCOMPANIA = @ccompania');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchServiceOrderFromBillLoadingQuery: async(searchData) => {
    try{
        let query = `select * from VWBUSCARORDENSERVICIOXFACTURA WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais${ searchData.cproveedor ? " and CPROVEEDOR = @cproveedor" : '' }${ searchData.ccliente ? " and CCLIENTE = @ccliente" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('cproveedor', sql.Int, searchData.cproveedor ? searchData.cproveedor: undefined)
            .input('ccliente', sql.Int, searchData.ccliente ? searchData.ccliente: undefined)
            .query(query);
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
ValidateCliente: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad)
            .query('select * from VWBUSCARPROPIETARIOXCONTRATOFLOTADATA WHERE XDOCIDENTIDAD = @xdocidentidad ');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
Validatepayment: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccodigo_ubii', sql.NVarChar, searchData.ccodigo_ubii)
            .query('select CESTATUSGENERAL from SURECIBO WHERE CCODIGO_UBII = @ccodigo_ubii ');
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchBrokerIndividualQuery: async(searchData) => {
    try{
        let query = `select * from MACORREDORES WHERE CCORREDOR = @ccorredor`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccorredor', sql.Int, searchData.ccorredor)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
SearchPlanValue: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cmetodologiapago', sql.NVarChar, searchData.cmetodologiapago)
        .input('cplan_rc', sql.NVarChar, searchData.cplan_rc)
        .input('ctarifa_exceso', sql.Int, searchData.ctarifa_exceso)
        .input('igrua', sql.Bit, searchData.igrua)
        .input('ncapacidad_p', sql.Int, searchData.ncapacidad_p)
        .execute('tmBCalculo_Recibo');
         let query= await pool.request()
        .query('select * from TMCALCULO_RECIBO');
        return { result: query };
              
    }catch(err){
        return { error: err.message };
        }
},
SearchPlanGrua: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('ctarifa_exceso', sql.Int, searchData.ctarifa_exceso)
        .query('select * from PRTARIFA_EXCESO where CTARIFA_EXCESO = @ctarifa_exceso');
      
        return { result: result };
              
    }catch(err){
        return { error: err.message };
        }
},
searchExchangeRateQuery: async(searchData) => {
    try{
        let query = `select * from ADTASACAMBIO WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais${ searchData.fingreso ? " and FINGRESO = @fingreso" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('fingreso', sql.DateTime, searchData.fingreso ? searchData.fingreso: 1)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
lastExchangeRateQuery: async() => {
    try{
        let query = 'SELECT TOP 1 * FROM ADTASACAMBIO ORDER BY CTASA DESC';
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createCreateExchangeRateQuery: async(dataList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        
        let insert = await pool.request()
            .input('cpais', sql.Int, dataList.cpais)
            .input('ccompania', sql.Int, dataList.ccompania)
            .input('mtasa_cambio', sql.Numeric(18, 2), dataList.mtasa_cambio)
            .input('fingreso', sql.DateTime, dataList.fingreso)
            .query('insert into ADTASACAMBIO (MTASA_CAMBIO, FINGRESO, CPAIS, CCOMPANIA) values (@mtasa_cambio, @fingreso, @cpais, @ccompania)')
        rowsAffected = rowsAffected + insert.rowsAffected;
        
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
detailExchangeRateQuery: async(searchData) => {
    try{
        let query = `select * from ADTASACAMBIO WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais AND CTASA = @ctasa`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('ctasa', sql.Int, searchData.ctasa)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchSettlementFromBillLoadingQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('ccliente', sql.Int, searchData.ccliente)
            .query('SELECT * FROM VWBUSCARFINIQUITOXFACTURA WHERE CCOMPANIA = @ccompania AND CCLIENTE = @ccliente');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
codeBillLoadingQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select MAX(CFACTURA) AS CFACTURA from ADREGISTROFACTURA');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createBillLoadingServiceOrderQuery: async(serviceOrderList, billLoadingData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < serviceOrderList.length; i++){
            let insert = await pool.request()
                .input('corden', sql.Int, serviceOrderList[i].corden)
                .input('cpais', sql.Int, billLoadingData.cpais)
                .input('ccompania', sql.Int, billLoadingData.ccompania)
                .input('cusuario', sql.Int, billLoadingData.cusuario)
                .input('cfactura', sql.Int, billLoadingData.cfactura)
                .input('cproveedor', sql.Int, billLoadingData.cproveedor)
                .input('xtipopagador', sql.NVarChar, billLoadingData.xtipopagador)
                .input('xpagador', sql.NVarChar, billLoadingData.xpagador)
                .input('crecibidor', sql.Int, billLoadingData.crecibidor)
                .input('ffactura', sql.DateTime, billLoadingData.ffactura)
                .input('frecepcion', sql.DateTime, billLoadingData.frecepcion)
                .input('fvencimiento', sql.DateTime, billLoadingData.fvencimiento)
                .input('nfactura', sql.Numeric(18, 0), billLoadingData.nfactura)
                .input('ncontrol', sql.Numeric(18, 0), billLoadingData.ncontrol)
                .input('mmontofactura', sql.Numeric(18, 2), billLoadingData.mmontofactura)
                .input('xobservacion', sql.NVarChar, billLoadingData.xobservacion)
                .input('cmoneda', sql.Int, billLoadingData.cmoneda)
                .input('xrutaarchivo', sql.NVarChar, billLoadingData.xrutaarchivo)
                .input('cestatusgeneral', sql.Int, billLoadingData.cestatusgeneral)
                .input('fcreacion', sql.DateTime, new Date())
                .query('INSERT INTO ADREGISTROFACTURA (CFACTURA, CORDEN, CPROVEEDOR, CRECIBIDOR, XTIPOPAGADOR, XPAGADOR, XOBSERVACION, FFACTURA, FRECEPCION, FVENCIMIENTO, NFACTURA, NCONTROL, MMONTOFACTURA, CMONEDA, XRUTAARCHIVO, CESTATUSGENERAL, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) VALUES (@cfactura, @corden, @cproveedor, @crecibidor, @xtipopagador, @xpagador, @xobservacion, @ffactura, @frecepcion, @fvencimiento, @nfactura, @ncontrol, @mmontofactura, @cmoneda, @xrutaarchivo, @cestatusgeneral, @cpais, @ccompania, @cusuario, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createBillLoadingSettlementQuery: async(settlementList, billLoadingData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < settlementList.length; i++){
            let insert = await pool.request()
                .input('cfiniquito', sql.Int, settlementList[i].cfiniquito)
                .input('cpais', sql.Int, billLoadingData.cpais)
                .input('ccompania', sql.Int, billLoadingData.ccompania)
                .input('cusuario', sql.Int, billLoadingData.cusuario)
                .input('cfactura', sql.Int, billLoadingData.cfactura)
                .input('cproveedor', sql.Int, billLoadingData.cproveedor)
                .input('xtipopagador', sql.NVarChar, billLoadingData.xtipopagador)
                .input('xpagador', sql.NVarChar, billLoadingData.xpagador)
                .input('crecibidor', sql.Int, billLoadingData.crecibidor)
                .input('ffactura', sql.DateTime, billLoadingData.ffactura)
                .input('frecepcion', sql.DateTime, billLoadingData.frecepcion)
                .input('fvencimiento', sql.DateTime, billLoadingData.fvencimiento)
                .input('nfactura', sql.Numeric(18, 0), billLoadingData.nfactura)
                .input('ncontrol', sql.Numeric(18, 0), billLoadingData.ncontrol)
                .input('mmontofactura', sql.Numeric(18, 2), billLoadingData.mmontofactura)
                .input('xobservacion', sql.NVarChar, billLoadingData.xobservacion)
                .input('cmoneda', sql.Int, billLoadingData.cmoneda)
                .input('xrutaarchivo', sql.NVarChar, billLoadingData.xrutaarchivo)
                .input('cestatusgeneral', sql.Int, billLoadingData.cestatusgeneral)
                .input('fcreacion', sql.DateTime, new Date())
                .query('INSERT INTO ADREGISTROFACTURA (CFACTURA, CFINIQUITO, CPROVEEDOR, CRECIBIDOR, XPAGADOR, XTIPOPAGADOR, XOBSERVACION,  FFACTURA, FRECEPCION, FVENCIMIENTO, NFACTURA, NCONTROL, MMONTOFACTURA, CMONEDA, XRUTAARCHIVO, CESTATUSGENERAL, CPAIS, CCOMPANIA, CUSUARIOCREACION, FCREACION) VALUES (@cfactura, @cfiniquito, @cproveedor, @crecibidor, @xpagador, @xtipopagador, @xobservacion, @ffactura, @frecepcion, @fvencimiento, @nfactura, @ncontrol, @mmontofactura, @cmoneda, @xrutaarchivo, @cestatusgeneral, @cpais, @ccompania, @cusuario, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
queryTypeMetodologiaContract: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('ccompania', sql.Int, searchData.ccompania)
        .input('cpais', sql.Int, searchData.cpais)
        .input('binternacional', sql.Bit, searchData.binternacional)
        .query('select * from MAMETODOLOGIAPAGO WHERE CCOMPANIA = @ccompania AND CPAIS = @cpais AND BACTIVO = 1 AND BINTERNACIONAL = @binternacional');
    //sql.close();
    return { result: result };
}catch(err){
    return { error: err.message };
}
},
destinationBankValrepQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from MABANCO_DESTINO WHERE BACTIVO = 1');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
destinationBankQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cpais', sql.Int, searchData.cpais)
        .input('ctipopago', sql.Int, searchData.ctipopago)
        .query('select * from MABANCO_DESTINO WHERE CPAIS = @cpais AND CTIPOPAGO = @ctipopago AND BACTIVO = 1');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchServiceOrderByBillQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cfactura', sql.Int, searchData.cfactura)
        .query('select * from VWBUSCARFACTURASREGISTRADAS WHERE CFACTURA = @cfactura AND CORDEN <> 0');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchSettlementByBillQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cfactura', sql.Int, searchData.cfactura)
        .query('select * from VWBUSCARFACTURASREGISTRADAS WHERE CFACTURA = @cfactura AND CFINIQUITO <> 0');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
cancellationDataQuery: async(searchData, cancellation) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let insert = await pool.request()
        .input('ccarga', sql.Int, cancellation.ccarga)
        .input('ccausaanulacion', sql.Int, cancellation.ccausaanulacion)
        .input('cestatusgeneral', sql.Int, 3)
        .input('cpais', sql.Int, searchData.cpais)
        .input('ccompania', sql.Int, searchData.ccompania)
        .input('fanulacion', sql.DateTime, new Date())
        .query('insert into TMANULACION (CCARGA, CCAUSAANULACION, FANULACION, CESTATUSGENERAL, CPAIS, CCOMPANIA) values (@ccarga, @ccausaanulacion, @fanulacion, @cestatusgeneral, @cpais, @ccompania)');
        rowsAffected = rowsAffected + insert.rowsAffected;
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){;
        return { error: err.message };
    }
},
searchtakersQuery: async(searchData) => {
    try{
        let query = `SELECT * FROM MATOMADORES WHERE CESTATUSGENERAL = @cestatusgeneral${ searchData.xrif ? " AND XRIF = @xrif" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('xrif', sql.NVarChar, searchData.xrif)
            .input('cestatusgeneral', sql.Int, 2)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){;
        return { error: err.message };
    }
},
createTakersQuery: async(createData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let insert = await pool.request()
            .input('xtomador', sql.NVarChar, createData.xtomador)
            .input('xprofesion', sql.NVarChar, createData.xprofesion)
            .input('xrif', sql.NVarChar, createData.xrif)
            .input('xdomicilio', sql.NVarChar, createData.xdomicilio)
            .input('cpais', sql.Int, createData.cpais)
            .input('cestado', sql.Int, createData.cestado)
            .input('cciudad', sql.Int, createData.cciudad)
            .input('xzona_postal', sql.NVarChar, createData.xzona_postal)
            .input('xtelefono', sql.NVarChar, createData.xtelefono)
            .input('cestatusgeneral', sql.Int, createData.cestatusgeneral)
            .input('xcorreo', sql.NVarChar, createData.xcorreo)
            .input('cusuariocreacion', sql.Int, createData.cusuario)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into MATOMADORES (XTOMADOR, XPROFESION, XRIF, XDOMICILIO, CPAIS, CESTADO, CCIUDAD, XZONA_POSTAL, XTELEFONO, CESTATUSGENERAL, XCORREO, CUSUARIOCREACION, FCREACION) values (@xtomador, @xprofesion, @xrif, @xdomicilio, @cpais, @cestado, @cciudad, @xzona_postal, @xtelefono, @cestatusgeneral, @xcorreo, @cusuariocreacion, @fcreacion)');
            rowsAffected = rowsAffected + insert.rowsAffected;
            return { result: { rowsAffected: rowsAffected } };
        }catch(err){
        return { error: err.message };
    }
},
detailTakersQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('ctomador', sql.Int, searchData.ctomador)
        .query('select * from VWBUSCARTOMADOR WHERE CTOMADOR = @ctomador');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateTakersQuery: async(createData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let update = await pool.request()
            .input('ctomador', sql.Int, createData.ctomador)
            .input('xtomador', sql.NVarChar, createData.xtomador)
            .input('xprofesion', sql.NVarChar, createData.xprofesion)
            .input('xrif', sql.NVarChar, createData.xrif)
            .input('xdomicilio', sql.NVarChar, createData.xdomicilio)
            .input('cpais', sql.Int, createData.cpais)
            .input('cestado', sql.Int, createData.cestado)
            .input('cciudad', sql.Int, createData.cciudad)
            .input('xzona_postal', sql.NVarChar, createData.xzona_postal)
            .input('xtelefono', sql.NVarChar, createData.xtelefono)
            .input('cestatusgeneral', sql.Int, createData.cestatusgeneral)
            .input('xcorreo', sql.NVarChar, createData.xcorreo)
            .query('UPDATE MATOMADORES SET XTOMADOR = @xtomador, XPROFESION = @xprofesion, XRIF = @xrif, XDOMICILIO = @xdomicilio, CPAIS = @cpais, CESTADO = @cestado, CCIUDAD = @cciudad, XZONA_POSTAL = @xzona_postal, XTELEFONO = @xtelefono, CESTATUSGENERAL = @cestatusgeneral, XCORREO = @xcorreo WHERE CTOMADOR = @ctomador');
            rowsAffected = rowsAffected + update.rowsAffected;
            return { result: { rowsAffected: rowsAffected } };
        }catch(err){
        return { error: err.message };
    }
},
takersValrepQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from MATOMADORES where CESTATUSGENERAL = 2');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
detailBillQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cfactura', sql.Int, searchData.cfactura)
            .query('select * from VWBUSCARFACTURASREGISTRADAS WHERE CFACTURA = @cfactura');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createPaymentQuery: async(paymentList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        
        let insert = await pool.request()
            .input('cfactura', sql.Int, paymentList.cfactura)
            .input('xcliente', sql.NVarChar, paymentList.xcliente)
            .input('nfactura', sql.Int, paymentList.nfactura)
            .input('ffactura', sql.DateTime, paymentList.ffactura)
            .input('msumafactura', sql.Numeric(18, 2), paymentList.msumafactura)
            .input('mmontocotizacion', sql.Numeric(18, 2), paymentList.mmontocotizacion)
            .input('mmontototaliva', sql.Numeric(18, 2), paymentList.mmontototaliva)
            .input('mmontototalretencion', sql.Numeric(18, 2), paymentList.mmontototalretencion)
            .input('mmontototalislr', sql.Numeric(18, 2), paymentList.mmontototalislr)
            .input('mmontototalimpuestos', sql.Numeric(18, 2), paymentList.mmontototalimpuestos)
            .input('mmontototalfactura', sql.Numeric(18, 2), paymentList.mmontototalfactura)
            .input('cestatusgeneral', sql.Int, paymentList.cestatusgeneral)
            .input('cusuariocreacion', sql.Int, paymentList.cusuario)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into ADREGISTROPAGOS (CFACTURA, XCLIENTE, NFACTURA, FFACTURA, MSUMAFACTURA, MMONTOCOTIZACION, MMONTOTOTALIVA, MMONTOTOTALRETENCION, MMONTOTOTALISLR, MMONTOTOTALIMPUESTOS, MMONTOTOTALFACTURA, CESTATUSGENERAL, CUSUARIOCREACION, FCREACION) values (@cfactura, @xcliente, @nfactura, @ffactura, @msumafactura, @mmontocotizacion, @mmontototaliva, @mmontototalretencion, @mmontototalislr, @mmontototalimpuestos, @mmontototalfactura, @cestatusgeneral, @cusuariocreacion, @fcreacion)')
        rowsAffected = rowsAffected + insert.rowsAffected;
        
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
dataPendingContractQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, data.cpais)
            .input('ccompania', sql.Int, data.ccompania)
            .query('SELECT COUNT(CCONTRATOFLOTA) AS NPERSONAS_PENDIENTES FROM VWBUSCARSUCONTRATOFLOTADATA WHERE CESTATUSGENERAL = 13 AND CPAIS = @cpais AND CCOMPANIA = @ccompania');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataContractsCollectedQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, data.cpais)
            .input('ccompania', sql.Int, data.ccompania)
            .query('SELECT COUNT(CCONTRATOFLOTA) AS NPERSONAS_COBRADAS FROM VWBUSCARSUCONTRATOFLOTADATA WHERE CESTATUSGENERAL = 7 AND CPAIS = @cpais AND CCOMPANIA = @ccompania');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataUserQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cusuario', sql.Int, data.cusuario)
            .query('SELECT * FROM SEUSUARIO WHERE CUSUARIO = @cusuario');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataNotificationsQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, data.cpais)
            .input('ccompania', sql.Int, data.ccompania)
            .query('SELECT COUNT(CNOTIFICACION) AS NNOTIFICACION FROM VWBUSCARNOTIFICACIONDATA WHERE CCOMPANIA = @ccompania');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataCountArysServiceQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT COUNT(CCODIGO_SERV) AS CCODIGO_SERV FROM SUCONTRATOFLOTA');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},

amountsPaidQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT DATEPART(month, FDESDE_POL) as MES, SUM(MCOSTO) as MPRIMA_ANUAL FROM VWBUSCARPLANXCONTRATO WHERE CESTATUSGENERAL = 7 GROUP BY DATEPART(month, FDESDE_POL)');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
amountsOutstandingQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT DATEPART(month, FDESDE_POL) as MES, SUM(MCOSTO) as MPRIMA_ANUAL FROM VWBUSCARPLANXCONTRATO WHERE CESTATUSGENERAL = 13 GROUP BY DATEPART(month, FDESDE_POL)');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},

countNotificationsQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT DATEPART(month, FCREACION) as MES, COUNT(CNOTIFICACION) as NOTIFICACIONES FROM EVNOTIFICACION GROUP BY DATEPART(month, FCREACION)');
        //sql.close()
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},

createQuoteQuery: async(userData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let insert = await pool.request()
            .input('xnombre', sql.NVarChar, userData.xnombre ? userData.xnombre: undefined)
            .input('xapellido', sql.NVarChar, userData.xapellido)
            .input('cano', sql.Numeric(11, 0), userData.cano)
            .input('xcolor', sql.NVarChar, userData.xcolor)
            .input('cmarca', sql.Int, userData.cmarca)
            .input('cmodelo', sql.Int, userData.cmodelo)
            .input('cversion', sql.Int, userData.cversion)
            .input('xrif_cliente', sql.NVarChar, userData.xrif_cliente)
            .input('email', sql.NVarChar, userData.email)
            .input('xtelefono_prop', sql.NVarChar , userData.xtelefono_prop)
            .input('xdireccionfiscal', sql.NVarChar, userData.xdireccionfiscal)
            .input('xserialmotor', sql.NVarChar, userData.xserialmotor)
            .input('xserialcarroceria', sql.NVarChar, userData.xserialcarroceria)
            .input('xplaca', sql.NVarChar, userData.xplaca)
            .input('xtelefono_emp', sql.NVarChar, userData.xtelefono_emp)
            .input('cplan', sql.Numeric(11, 0), userData.cplan)
            .input('ccorredor', sql.Numeric(11, 0), userData.ccorredor)
            .input('xcedula', sql.NVarChar, userData.xcedula)
            .input('cproductor', sql.Numeric(11, 0), userData.cproductor)
            .input('xcobertura', sql.NVarChar, userData.xcobertura)
            .input('cestatusgeneral', sql.Int, userData.cestatusgeneral)
            .input('ncapacidad_p', sql.NVarChar, userData.ncapacidad_p)
            .input('ctarifa_exceso', sql.Int, userData.ctarifa_exceso)
            .input('finicio',  sql.DateTime, new Date())
            .input('femision',  sql.DateTime, userData.femision)
            .input('cmetodologiapago', sql.Numeric(11, 0), userData.cmetodologiapago)
            .input('msuma_aseg', sql.Numeric(11, 2), userData.msuma_aseg)
            .input('pcasco', sql.Numeric(11, 2), userData.pcasco)
            .input('mprima_casco', sql.Numeric(11, 2), userData.mprima_casco)
            .input('mcatastrofico', sql.Numeric(11, 2), userData.mcatastrofico)
            .input('pdescuento', sql.Numeric(17, 2), userData.pdescuento)
            .input('ifraccionamiento', sql.Bit, userData.ifraccionamiento)
            .input('ncuotas', sql.Int, userData.ncuotas)
            .input('mprima_blindaje', sql.Numeric(11, 2), userData.mprima_blindaje)
            .input('msuma_blindaje', sql.Numeric(11, 2), userData.msuma_blindaje)
            .input('mprima_bruta', sql.Numeric(11, 2), userData.mprima_bruta)
            .input('pcatastrofico', sql.Numeric(11, 2), userData.pcatastrofico)
            .input('pmotin', sql.Numeric(11, 2), userData.pmotin)
            .input('mmotin', sql.Numeric(11, 2), userData.mmotin)
            .input('pblindaje', sql.Numeric(11, 2), userData.pblindaje)
            .input('cestado', sql.Numeric(11, 0), userData.cestado)
            .input('cciudad', sql.Numeric(11, 0), userData.cciudad)
            .input('cpais', sql.Numeric(11, 0), userData.cpais)
            .input('icedula', sql.NVarChar, userData.icedula)
            .input('ivigencia', sql.Int, userData.ivigencia)
            .input('mgrua', sql.NVarChar ,userData.mgrua)
            .input('ctomador', sql.Int, userData.ctomador ? userData.ctomador: 0)
            .input('cusuariocreacion', sql.Int, userData.cusuario ? userData.cusuario: 0)
            .input('xzona_postal', sql.NVarChar, userData.xzona_postal)
            .input('cuso', sql.NVarChar, userData.cuso)
            .input('ctipovehiculo', sql.Int, userData.ctipovehiculo)
            .input('nkilometraje', sql.Numeric(18, 2), userData.nkilometraje)
            .input('cclase', sql.Int, userData.cclase)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CTCOTIZACION(XNOMBRE, XAPELLIDO, CANO, XCOLOR, CMARCA, CMODELO, CVERSION, XRIF_CLIENTE, EMAIL, XTELEFONO_PROP, XDIRECCIONFISCAL, XSERIALMOTOR, XSERIALCARROCERIA, XPLACA, XTELEFONO_EMP, CPLAN, CCORREDOR, XCEDULA, XCOBERTURA, NCAPACIDAD_P, CTARIFA_EXCESO, FINICIO, CMETODOLOGIAPAGO, MSUMA_ASEG, PCASCO, MPRIMA_CASCO, MCATASTROFICO, PDESCUENTO, IFRACCIONAMIENTO, NCUOTAS, MPRIMA_BLINDAJE, MSUMA_BLINDAJE, MPRIMA_BRUTA, PCATASTROFICO, PMOTIN, MMOTIN, PBLINDAJE, CESTADO, CCIUDAD, CPAIS, ICEDULA, FEMISION, IVIGENCIA, MGRUA, CESTATUSGENERAL, CTOMADOR, XZONA_POSTAL,CUSO ,CTIPOVEHICULO, FCREACION, CUSUARIOCREACION, NKILOMETRAJE, CCLASE) values (@xnombre, @xapellido, @cano, @xcolor, @cmarca, @cmodelo, @cversion, @xrif_cliente, @email, @xtelefono_prop, @xdireccionfiscal, @xserialmotor, @xserialcarroceria, @xplaca, @xtelefono_emp, @cplan, @ccorredor, @xcedula, @xcobertura, @ncapacidad_p, @ctarifa_exceso, @finicio, @cmetodologiapago, @msuma_aseg, @pcasco, @mprima_casco, @mcatastrofico, @pdescuento, @ifraccionamiento, @ncuotas, @mprima_blindaje, @msuma_blindaje, @mprima_bruta,@pcatastrofico ,@pmotin, @mmotin, @pblindaje, @cestado, @cciudad, @cpais, @icedula, @femision, @ivigencia, @mgrua, @cestatusgeneral, @ctomador, @xzona_postal, @cuso, @ctipovehiculo, @fcreacion, @cusuariocreacion, @nkilometraje, @cclase)')                
             return { result: { rowsAffected: rowsAffected, status: true } };
    }
    catch(err){
        return { error: err.message };
    }
},
getLastQuoteQuery: async() => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT TOP 1 * FROM VWBUSCARCOTIZACION ORDER BY XNOMBRE DESC')
        return { result: result };
    }catch(err) {;
        return { error: err.message };
    }
},
searchPlanQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .input('ctipoplan', sql.Int, searchData.ctipoplan ? searchData.ctipoplan : null)
            .input('xplan', sql.NVarChar, searchData.xplan ? searchData.xplan : null)
            .input('ccanal', sql.Int, searchData.ccanal ? searchData.ccanal : undefined)
            .query(`select * from POPLAN where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.ctipoplan ? ' and CTIPOPLAN = @CTIPOPLAN' : '' }${ searchData.xplan ? ' and XPLAN = @xplan' : '' }${ searchData.ccanal ? ' and CCANAL = @ccanal' : '' }`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getPlanServicesInsurersDataQuery: async(cplan) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query('select * from VWBUSCARSERVICIOASEGURADORAXPLANDATA where CPLAN = @cplan');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceFromPlanQuery: async(ctiposervicio) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ctiposervicio', sql.Int, ctiposervicio)
            .query('select * from MASERVICIO where CTIPOSERVICIO = @ctiposervicio');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createServiceTypeFromPlanQuery: async(serviceTypeList, dataList, cplan) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < serviceTypeList.length; i++){
            let insert = await pool.request()
                .input('cplan', sql.Int, cplan)
                .input('ctiposervicio', sql.Int, serviceTypeList[i].ctiposervicio)
                .input('baceptado', sql.Bit, serviceTypeList[i].baceptado)
                .input('bactivo', sql.Bit, dataList.bactivo)
                .input('cusuariocreacion', sql.Int, dataList.cusuario)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into POTIPOSERVICIOS (CPLAN, CTIPOSERVICIO, BACEPTADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cplan, @ctiposervicio, @baceptado, @bactivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createPlanQuery: async(dataList, cplan) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .input('xplan', sql.NVarChar, dataList.xplan)
            .input('ctipoplan', sql.Int, dataList.ctipoplan)
            .input('brcv', sql.Int, dataList.brcv)
            .input('cpais', sql.Int, dataList.cpais)
            .input('ccompania', sql.Int, dataList.ccompania)
            .input('mcosto', sql.Numeric(18, 2), dataList.mcosto)
            .input('cmoneda', sql.Int, dataList.cmoneda)
            .input('ccanal', sql.Int, dataList.ccanal)
            .input('bactivo', sql.Bit, dataList.bactivo)
            .input('cusuariocreacion', sql.Int, dataList.cusuario)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into POPLAN (CPLAN, XPLAN, CTIPOPLAN, BRCV, CPAIS, CCOMPANIA, MCOSTO, CMONEDA, BACTIVO, CUSUARIOCREACION, FCREACION, CCANAL ) values (@cplan, @xplan, @ctipoplan, @brcv, @cpais, @ccompania, @mcosto, @cmoneda, @bactivo, @cusuariocreacion, @fcreacion, @ccanal)')

            return { result: result, cplan};
    }
    catch(err){
        return { error: err.message };
    }
},
searchCodePlanQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select MAX(CPLAN) AS CPLAN from POPLAN');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchLastPlanQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select MAX(CPLAN) AS CPLAN, MAX(XPLAN) AS XPLAN from POPLAN');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createServicePlanRcvQuery: async(dataList, plan) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, plan.cplan)
            .input('cservicio_aseg', sql.Int, dataList.cservicio_aseg)
            .input('cplan_rc', sql.Int, plan.cplan)
            .input('ctiposervicio', sql.Int, dataList.ctiposervicio)
            .input('ctipoagotamientoservicio', sql.Int, dataList.ctipoagotamientoservicio)
            .input('ncantidad', sql.Int, dataList.ncantidad)
            .input('pservicio', sql.Numeric(5, 2), dataList.pservicio)
            .input('mmaximocobertura', sql.Numeric(11, 2), dataList.mmaximocobertura)
            .input('mdeducible', sql.Numeric(11, 2), dataList.mdeducible)
            .input('bserviciopadre', sql.Bit, dataList.bserviciopadre)
            .input('bactivo', sql.Bit, dataList.bactivo)
            .input('cusuariocreacion', sql.Int, dataList.cusuario)
            .input('fcreacion', sql.DateTime, new Date())
            .query('INSERT INTO POSERVICIOPLAN_RC (CPLAN, CSERVICIO_ASEG, CPLAN_RC, CTIPOSERVICIO, CTIPOAGOTAMIENTOSERVICIO, NCANTIDAD, PSERVICIO, MMAXIMOCOBERTURA, MDEDUCIBLE, BSERVICIOPADRE, BACTIVO, FCREACION, CUSUARIOCREACION  ) values (@cplan, @cservicio_aseg, @cplan_rc, @ctiposervicio, @ctipoagotamientoservicio, @ncantidad, @pservicio, @mmaximocobertura, @mdeducible, @bserviciopadre, @bactivo, @fcreacion, @cusuariocreacion)')

            return { result: result};
    }
    catch(err){
        return { error: err.message };
    }
},
createPlanRcvQuery: async(dataPlanRcv) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('xdescripcion', sql.NVarChar, dataPlanRcv.xdescripcion)
            .input('mcosto', sql.NVarChar, dataPlanRcv.mcosto)
            .input('cmoneda', sql.Int, 2)
            .input('caseguradora', sql.Int, 1)
            .input('bactivo', sql.Bit, 1)
            .input('cusuariocreacion', sql.Int, dataPlanRcv.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('INSERT INTO POPLAN_RC (XDESCRIPCION, MCOSTO, CMONEDA, CASEGURADORA, BACTIVO, FCREACION, CUSUARIOCREACION) values (@xdescripcion, @mcosto, @cmoneda, @caseguradora, @bactivo, @fcreacion, @cusuariocreacion)')

            return { result: result};
    }
    catch(err){
        return { error: err.message };
    }
},
searchLast2PlanQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT TOP 1 * FROM POPLAN ORDER BY CPLAN DESC');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceTypePlanQuery: async(cplan) => {
    try{
        let query = `select * from VWBUSCARTIPOSERVICIOSXPLAN where CPLAN = @cplan`
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
valrepPlanWithoutRcvQuery: async(searchData) => {
    try{
        let query = `select * from VWBUSCARPLANDATA where CPAIS = @cpais and CCOMPANIA = @ccompania AND BRCV = 0 AND BACTIVO = 1 AND CTIPOPLAN = 2${ searchData.ccanal ? ' and CCANAL = @ccanal' : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccanal', sql.Int, searchData.ccanal ? searchData.ccanal: undefined)
            .input('cpais', sql.Numeric(4, 0), searchData.cpais)
            .input('ccompania', sql.Int, searchData.ccompania)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createContractServiceArysQuery: async(userData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let insert = await pool.request()
            .input('xnombre', sql.NVarChar, userData.xnombre ? userData.xnombre: undefined)
            .input('xapellido', sql.NVarChar, userData.xapellido)
            .input('cano', sql.Numeric(11, 0), userData.cano)
            .input('xcolor', sql.NVarChar, userData.xcolor)
            .input('cmarca', sql.Int, userData.cmarca)
            .input('cmodelo', sql.Int, userData.cmodelo)
            .input('cversion', sql.Int, userData.cversion)
            .input('xmarca', sql.NVarChar, userData.xmarca)
            .input('xmodelo', sql.NVarChar, userData.xmodelo)
            .input('xversion', sql.NVarChar, userData.xversion)
            .input('nkilometraje', sql.Numeric(11, 2), userData.nkilometraje)
            .input('xpais_proveniente', sql.NVarChar, userData.xpais_proveniente)
            .input('xrif_cliente', sql.NVarChar, userData.xrif_cliente)
            .input('email', sql.NVarChar, userData.email)
            .input('xtelefono_prop', sql.NVarChar , userData.xtelefono_prop)
            .input('xdireccionfiscal', sql.NVarChar, userData.xdireccionfiscal)
            .input('xserialmotor', sql.NVarChar, userData.xserialmotor)
            .input('xserialcarroceria', sql.NVarChar, userData.xserialcarroceria)
            .input('xplaca', sql.NVarChar, userData.xplaca)
            .input('xtelefono_emp', sql.NVarChar, userData.xtelefono_emp)
            .input('cplan', sql.Numeric(11, 0), userData.cplan)
            .input('xcedula', sql.NVarChar, userData.xcedula)
            .input('ncapacidad_p', sql.NVarChar, userData.ncapacidad_p)
            .input('finicio',  sql.DateTime, new Date())
            .input('femision',  sql.DateTime, new Date())
            .input('cestado', sql.Numeric(11, 0), userData.cestado)
            .input('cciudad', sql.Numeric(11, 0), userData.cciudad)
            .input('cpais', sql.Numeric(11, 0), userData.cpais)
            .input('icedula', sql.NVarChar, userData.icedula)
            .input('ivigencia', sql.Int, userData.ivigencia)
            .input('cusuariocreacion', sql.Int, userData.cusuario ? userData.cusuario: 0)
            .input('cestatusgeneral', sql.Int, userData.cestatusgeneral)
            .input('ccorregimiento', sql.Int, userData.ccorregimiento)
            .input('cuso', sql.Int, userData.cuso)
            .input('ctipovehiculo', sql.Int, userData.ctipovehiculo)
            .input('ccorredor', sql.Int, userData.ccorredor)
            .input('fdesde_pol', sql.DateTime, userData.fdesde_pol)
            .input('fhasta_pol', sql.DateTime, userData.fhasta_pol)
            .input('fnac', sql.DateTime, userData.fnac)
            .input('cplan_rc', sql.Int, userData.cplan_rc)
            .input('xcobertura', sql.NVarChar, userData.xcobertura)
            .input('msuma_casco', sql.Numeric(18, 2), userData.msuma_casco)
            .input('mprima_casco', sql.Numeric(18, 2), userData.mprima_casco)
            .input('xmes_venplaca', sql.NVarChar, userData.xmes_venplaca)
            .input('ccanal', sql.Int, userData.ccanal)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into TMEMISION_SERVICIOS (XRIF_CLIENTE, XNOMBRE, XAPELLIDO, CMARCA, CMODELO, CVERSION, NKILOMETRAJE, CANO, XCOLOR, EMAIL, XTELEFONO_PROP, XDIRECCIONFISCAL, XSERIALMOTOR, XSERIALCARROCERIA, XPLACA, XTELEFONO_EMP, CPLAN, XCEDULA, FINICIO, CESTADO, CCIUDAD, CPAIS, ICEDULA, FEMISION, CESTATUSGENERAL, FCREACION, CUSUARIOCREACION, CCORREGIMIENTO, CUSO, CTIPOVEHICULO, CCORREDOR, FDESDE_POL, FHASTA_POL, FNAC, CPLAN_RC, XMARCA, XMODELO, XVERSION, NPASAJEROS, XPAIS_PROVENIENTE, XCOBERTURA, MSUMA_CASCO, MPRIMA_CASCO, XMES_VENPLACA, CCANAL) values (@xrif_cliente, @xnombre, @xapellido, @cmarca, @cmodelo, @cversion, @nkilometraje, @cano, @xcolor, @email, @xtelefono_prop, @xdireccionfiscal, @xserialmotor, @xserialcarroceria, @xplaca, @xtelefono_emp, @cplan, @xcedula, @finicio, @cestado, @cciudad, @cpais, @icedula, @femision, @cestatusgeneral, @fcreacion, @cusuariocreacion, @ccorregimiento, @cuso, @ctipovehiculo, @ccorredor, @fdesde_pol, @fhasta_pol, @fnac, @cplan_rc, @xmarca, @xmodelo, @xversion, @ncapacidad_p, @xpais_proveniente, @xcobertura, @msuma_casco, @mprima_casco, @xmes_venplaca, @ccanal )')        
            rowsAffected = rowsAffected + insert.rowsAffected;        
             return { result: { rowsAffected: rowsAffected} };
    }
    catch(err){
        return { error: err.message };
    }
},
updateServiceFromQuantityQuery: async(quantityList, cplan) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < quantityList.length; i++){
            let update = await pool.request()
                .input('cplan', sql.Int, cplan)
                .input('baceptado', sql.Bit, quantityList[i].baceptado)
                .input('ncantidad', sql.Int, quantityList[i].ncantidad)
                .input('pservicio', sql.Numeric(5, 2), quantityList[i].pservicio)
                .input('mmaximocobertura', sql.Numeric(18, 2), quantityList[i].mmaximocobertura)
                .input('mdeducible', sql.Numeric(18, 2), quantityList[i].mdeducible)
                .input('cservicio', sql.Int, quantityList[i].cservicio)
                .query('UPDATE POSERVICIOS SET NCANTIDAD = @ncantidad, PSERVICIO = @pservicio, MMAXIMOCOBERTURA = @mmaximocobertura, MDEDUCIBLE = @mdeducible, BACEPTADO = @baceptado WHERE CPLAN = @cplan AND CSERVICIO = @cservicio')
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchApovQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cplan', sql.Int, searchData.cplan)
        .input('cmoneda', sql.Int, searchData.cmoneda)
        .execute('poBTasas_RCV');
        let query= await pool.request()
        .input('cplan', sql.Int, searchData.cplan)
        .query('select * from POTASAS_APOV WHERE CPLAN = @cplan');
        return { result: query };
    }catch(err){
        return { error: err.message };
        }
},
searchExcesoQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
        .input('cplan', sql.Int, searchData.cplan)
        .input('cmoneda', sql.Int, searchData.cmoneda)
        .execute('poBTasas_RCV');
        let query= await pool.request()
        .input('cplan', sql.Int, searchData.cplan)
        .query('select * from POTASAS_EXC WHERE CPLAN = @cplan');
        return { result: query };
    }catch(err){
        return { error: err.message };
        }
},
updatePlanQuery: async(dataList) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Int, dataList.cpais)
            .input('ccompania', sql.Int, dataList.ccompania)
            .input('cplan', sql.Int, dataList.cplan)
            .input('ctipoplan', sql.Int, dataList.ctipoplan)
            .input('xplan', sql.NVarChar, dataList.xplan)
            .input('mcosto', sql.Numeric(18, 2), dataList.mcosto)
            .input('cmoneda', sql.Int, dataList.cmoneda)
            .input('bactivo', sql.Bit, dataList.bactivo)
            .input('cusuariomodificacion', sql.Int, dataList.cusuariomodificacion)
            .input('fmodificacion', sql.DateTime, new Date())
            .query('update POPLAN set XPLAN = @xplan, CTIPOPLAN = @ctipoplan, MCOSTO = @mcosto, CMONEDA = @cmoneda, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPLAN = @cplan and CPAIS = @cpais and CCOMPANIA = @ccompania');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateQuatityFromPlanQuery: async(updateQuatityList, dataList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateQuatityList.length; i++){
            let update = await pool.request()
                .input('cplan', sql.Int, dataList.cplan)
                .input('ncantidad', sql.Int, updateQuatityList[i].ncantidad)
                .input('cservicio', sql.Int, updateQuatityList[i].cservicio)
                .input('pservicio', sql.Numeric(18, 2), updateQuatityList[i].pservicio)
                .input('mmaximocobertura', sql.Numeric(18, 2), updateQuatityList[i].mmaximocobertura)
                .input('mdeducible', sql.Numeric(18, 2), updateQuatityList[i].mdeducible)
                .query('UPDATE POSERVICIOS SET NCANTIDAD = @ncantidad, PSERVICIO = @pservicio, MMAXIMOCOBERTURA = @mmaximocobertura, MDEDUCIBLE = @mdeducible WHERE CPLAN = @cplan AND CSERVICIO = @cservicio')
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateQuatityFromPlanRcvQuery: async(updateQuatityList, dataPlanRcv) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateQuatityList.length; i++){
            let update = await pool.request()
                .input('cplan_rc', sql.Int, dataPlanRcv.cplan_rc)
                .input('ncantidad', sql.Int, updateQuatityList[i].ncantidad)
                .input('cservicio', sql.Int, updateQuatityList[i].cservicio)
                .input('pservicio', sql.Numeric(18, 2), updateQuatityList[i].pservicio)
                .input('mmaximocobertura', sql.Numeric(18, 2), updateQuatityList[i].mmaximocobertura)
                .input('mdeducible', sql.Numeric(18, 2), updateQuatityList[i].mdeducible)
                .query('UPDATE POSERVICIOS_RC SET NCANTIDAD = @ncantidad, PSERVICIO = @pservicio, MMAXIMOCOBERTURA = @mmaximocobertura, MDEDUCIBLE = @mdeducible WHERE CPLAN_RC = @cplan_rc AND CSERVICIO = @cservicio')
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateExcesoFromPlanQuery: async(excesoList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < excesoList.length; i++){
            let update = await pool.request()
                .input('cplan', sql.Int, excesoList[i].cplan)
                .input('ctarifa', sql.Int, excesoList[i].ctarifa)
                .input('ms_defensa_penal', sql.Numeric(18, 2), excesoList[i].ms_defensa_penal)
                .input('mp_defensa_penal', sql.Numeric(18, 2), excesoList[i].mp_defensa_penal)
                .input('ms_exceso_limite', sql.Numeric(18, 2), excesoList[i].ms_exceso_limite)
                .input('mp_exceso_limite', sql.Numeric(18, 2), excesoList[i].mp_exceso_limite)
                .query('UPDATE POTASAS_EXC SET MS_DEFENSA_PENAL = @ms_defensa_penal, MP_DEFENSA_PENAL = @mp_defensa_penal, MS_EXCESO_LIMITE = @ms_exceso_limite, MP_EXCESO_LIMITE = @mp_exceso_limite WHERE CPLAN = @cplan AND CTARIFA = @ctarifa')
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientDataQuery: async(clientData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), clientData.cpais)
            .input('ccompania', sql.Int, clientData.ccompania)
            .input('ccliente', sql.Int, clientData.ccliente)
            .query('select * from VWBUSCARCLIENTES where CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchClientQuery: async(searchData) => {
    try{
        let query = `select * from CLCLIENTE where CPAIS = @cpais and CCOMPANIA = @ccompania${ searchData.xcliente ? " and XCLIENTE like '%" + searchData.xcliente + "%'" : '' }${ searchData.xdocidentidad ? " and XDOCIDENTIDAD like '%" + searchData.xdocidentidad + "%'" : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), searchData.cpais ? searchData.cpais : undefined)
            .input('ccompania', sql.Int, searchData.ccompania ? searchData.ccompania : undefined)
            .input('xdocidentidad', sql.NVarChar, searchData.xdocidentidad ? searchData.xdocidentidad : undefined)
            .input('xcliente', sql.NVarChar, searchData.xcliente ? searchData.xcliente : undefined)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getClientBanksDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARBANCOXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getClientContactsDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from CLCONTACTO where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getClientDocumentsDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from CLDOCUMENTO where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createClientQuery: async(clientData) => {
    try{
        let pool = await sql.connect(config);
            let result = await pool.request()
                .input('cpais', sql.Numeric(4, 0), clientData.cpais)
                .input('ccompania', sql.Int, clientData.ccompania)
                .input('itipocliente', sql.Char, 'C')
                .input('xcliente', sql.NVarChar, clientData.xcliente)
                .input('xrepresentante', sql.NVarChar, clientData.xrepresentante)
                .input('icedula', sql.NVarChar, clientData.icedula)
                .input('xdocidentidad', sql.NVarChar, clientData.xdocidentidad)
                .input('cestado', sql.Int, clientData.cestado)
                .input('cciudad', sql.Int, clientData.cciudad)
                .input('xdireccionfiscal', sql.NVarChar, clientData.xdireccionfiscal)
                .input('xemail', sql.NVarChar, clientData.xemail)
                .input('finicio', sql.DateTime, clientData.finicio)
                .input('xtelefono', sql.NVarChar, clientData.xtelefono ? clientData.xtelefono : null)
                .input('xpaginaweb', sql.NVarChar, clientData.xpaginaweb ? clientData.xpaginaweb : null)
                .input('xrutaimagen', sql.NVarChar, clientData.xrutaimagen ? clientData.xrutaimagen : null)
                .input('bactivo', sql.Bit, clientData.bactivo)
                .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLCLIENTE (ITIPOCLIENTE, CPAIS, CCOMPANIA, XCLIENTE, XREPRESENTANTE, ICEDULA, XDOCIDENTIDAD, CESTADO, CCIUDAD, XDIRECCIONFISCAL, XEMAIL, FINICIO, XTELEFONO, XPAGINAWEB, XRUTAIMAGEN, BACTIVO, CUSUARIOCREACION, FCREACION) output inserted.CCLIENTE values (@itipocliente, @cpais, @ccompania, @xcliente, @xrepresentante, @icedula, @xdocidentidad, @cestado, @cciudad, @xdireccionfiscal, @xemail, @finicio, @xtelefono, @xpaginaweb, @xrutaimagen, @bactivo, @cusuariocreacion, @fcreacion)');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createBanksFromClientQuery: async(clientData, bankList, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < bankList.length; i++){
            let insert = await pool.request()
                .input('ccliente', sql.Int, ccliente)
                .input('cbanco', sql.Int, bankList[i].cbanco)
                .input('ctipocuentabancaria', sql.Int, bankList[i].ctipocuentabancaria)
                .input('xnumerocuenta', sql.NVarChar, bankList[i].xnumerocuenta)
                .input('bprincipal', sql.Bit, bankList[i].bprincipal ? bankList[i].bprincipal: false)
                .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLBANCO (CCLIENTE, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@ccliente, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @bprincipal, @cusuariocreacion, @fcreacion)')
                rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createContactsFromClientQuery: async(clientData, contactsList, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < contactsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('xnombre', sql.NVarChar, contactsList[i].xnombre)
            .input('xapellido', sql.NVarChar, contactsList[i].xapellido)
            .input('icedula', sql.NVarChar,  contactsList[i].icedula)
            .input('xdocidentidad', sql.NVarChar, contactsList[i].xdocidentidad)
            .input('xtelefonocelular', sql.NVarChar, contactsList[i].xtelefonocelular)
            .input('xemail', sql.NVarChar, contactsList[i].xemail)
            .input('xcargo', sql.NVarChar, contactsList[i].xcargo)
            .input('xtelefonooficina', sql.NVarChar, contactsList[i].xtelefonooficina)
            .input('xtelefonocasa', sql.NVarChar, contactsList[i].xtelefonocasa)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLCONTACTO (CCLIENTE, XNOMBRE, XAPELLIDO, ICEDULA, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XTELEFONOOFICINA, XTELEFONOCASA, CUSUARIOCREACION, FCREACION) values (@ccliente, @xnombre, @xapellido, @icedula, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xtelefonooficina, @xtelefonocasa, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createContactsFromClientUpdateQuery: async(clientData, contactsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < contactsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('xnombre', sql.NVarChar, contactsList[i].xnombre)
            .input('xapellido', sql.NVarChar, contactsList[i].xapellido)
            .input('icedula', sql.NVarChar,  contactsList[i].icedula)
            .input('xdocidentidad', sql.NVarChar, contactsList[i].xdocidentidad)
            .input('xtelefonocelular', sql.NVarChar, contactsList[i].xtelefonocelular)
            .input('xemail', sql.NVarChar, contactsList[i].xemail)
            .input('xcargo', sql.NVarChar, contactsList[i].xcargo)
            .input('xtelefonooficina', sql.NVarChar, contactsList[i].xtelefonooficina)
            .input('xtelefonocasa', sql.NVarChar, contactsList[i].xtelefonocasa)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLCONTACTO (CCLIENTE, XNOMBRE, XAPELLIDO, ICEDULA, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XTELEFONOOFICINA, XTELEFONOCASA, CUSUARIOCREACION, FCREACION) values (@ccliente, @xnombre, @xapellido, @icedula, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xtelefonooficina, @xtelefonocasa, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createDocumentsFromClientQuery: async(clientData, createDocumentsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createDocumentsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('xdocumento', sql.NVarChar, createDocumentsList[i].xdocumento)
            .input('xrutaarchivo', sql.NVarChar, createDocumentsList[i].xrutaarchivo)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLDOCUMENTO (CCLIENTE, XDOCUMENTO, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@ccliente, @xdocumento, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createAssociatesFromClientQuery: async(clientData, associates, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < associates.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('casociado', sql.NVarChar, associates[i].casociado)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLASOCIADO (CCLIENTE, CASOCIADO, CUSUARIOCREACION, FCREACION) values (@ccliente, @casociado, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createAssociatesFromClientUpdateQuery: async(clientData, createAssociatesList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createAssociatesList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('casociado', sql.Int, createAssociatesList[i].casociado)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLASOCIADO (CCLIENTE, CASOCIADO, CUSUARIOCREACION, FCREACION) values (@ccliente, @casociado, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateAssociatesByClientUpdateQuery: async(clientData, updateAssociatesList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateAssociatesList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('casociado', sql.Int, updateAssociatesList[i].casociado)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLASOCIADO set CASOCIADO = @casociado, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createBondsFromClientQuery: async(clientData, bonds, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < bonds.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('pbono', sql.Numeric(5, 2), bonds[i].pbono)
            .input('mbono', sql.Numeric(11, 2), bonds[i].mbono)
            .input('fefectiva', sql.DateTime, bonds[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLBONO (CCLIENTE, PBONO, MBONO, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @pbono, @mbono, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createBondsFromClientUpdateQuery: async(clientData, createBondsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createBondsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('pbono', sql.Numeric(5, 2), createBondsList[i].pbono)
            .input('mbono', sql.Numeric(11, 2), createBondsList[i].mbono)
            .input('fefectiva', sql.DateTime, createBondsList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLBONO (CCLIENTE, PBONO, MBONO, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @pbono, @mbono, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateBondsByClientUpdateQuery: async(clientData, updateBondsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateBondsList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cbono', sql.Int, updateBondsList[i].cbono)
                .input('pbono', sql.Numeric(5, 2), updateBondsList[i].pbono)
                .input('mbono', sql.Numeric(11, 2), updateBondsList[i].mbono)
                .input('fefectiva', sql.DateTime, updateBondsList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLBONO set PBONO = @pbono, MBONO = @mbono, FEFECTIVA = @fefectiva, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CBONO = @cbono');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientBondsDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from CLBONO where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createBrokersFromClientQuery: async(clientData, brokers, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < brokers.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('ccorredor', sql.Int, brokers[i].ccorredor)
            .input('pcorredor', sql.Int, brokers[i].pcorredor)
            .input('mcorredor', sql.Numeric(11, 2), brokers[i].mcorredor)
            .input('fefectiva', sql.DateTime, brokers[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLCORREDOR (CCLIENTE, CCORREDOR, PCORREDOR, MCORREDOR, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @ccorredor, @pcorredor, @mcorredor, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createBrokersFromClientUpdateQuery: async(clientData, createBrokersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createBrokersList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('ccorredor', sql.Int, createBrokersList[i].ccorredor)
            .input('pcorredor', sql.Int, createBrokersList[i].pcorredor)
            .input('mcorredor', sql.Numeric(11, 2), createBrokersList[i].mcorredor)
            .input('fefectiva', sql.DateTime, createBrokersList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLCORREDOR (CCLIENTE, CCORREDOR, PCORREDOR, MCORREDOR, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @ccorredor, @pcorredor, @mcorredor, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateBrokersByClientUpdateQuery: async(clientData, updateBrokersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateBrokersList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('ccorredor', sql.Int, updateBrokersList[i].ccorredor)
                .input('pcorredor', sql.Int, updateBrokersList[i].pcorredor)
                .input('mcorredor', sql.Numeric(11, 2), updateBrokersList[i].mcorredor)
                .input('fefectiva', sql.DateTime, updateBrokersList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLCORREDOR set PCORREDOR = @pcorredor, MCORREDOR = @mcorredor, FEFECTIVA = @fefectiva, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CCORREDOR = @ccorredor');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientBrokersDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARCORREDORXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createDepreciationsFromClientQuery: async(clientData, depreciations, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < depreciations.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('cdepreciacion', sql.Int, depreciations[i].cdepreciacion)
            .input('pdepreciacion', sql.Int, depreciations[i].pdepreciacion)
            .input('mdepreciacion', sql.Numeric(11, 2), depreciations[i].mdepreciacion)
            .input('fefectiva', sql.DateTime, depreciations[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLDEPRECIACION (CCLIENTE, CDEPRECIACION, PDEPRECIACION, MDEPRECIACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cdepreciacion, @pdepreciacion, @mdepreciacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createDepreciationsFromClientUpdateQuery: async(clientData, createDepreciationsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createDepreciationsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('cdepreciacion', sql.Int, createDepreciationsList[i].cdepreciacion)
            .input('pdepreciacion', sql.Int, createDepreciationsList[i].pdepreciacion)
            .input('mdepreciacion', sql.Numeric(11, 2), createDepreciationsList[i].mdepreciacion)
            .input('fefectiva', sql.DateTime, createDepreciationsList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLDEPRECIACION (CCLIENTE, CDEPRECIACION, PDEPRECIACION, MDEPRECIACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cdepreciacion, @pdepreciacion, @mdepreciacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateDepreciationsByClientUpdateQuery: async(clientData, updateDepreciationsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateDepreciationsList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cdepreciacion', sql.Int, updateDepreciationsList[i].cdepreciacion)
                .input('pdepreciacion', sql.Int, updateDepreciationsList[i].pdepreciacion)
                .input('mdepreciacion', sql.Numeric(11, 2), updateDepreciationsList[i].mdepreciacion)
                .input('fefectiva', sql.DateTime, updateDepreciationsList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLDEPRECIACION set PDEPRECIACION = @pdepreciacion, MDEPRECIACION = @mdepreciacion, FEFECTIVA = @fefectiva, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CDEPRECIACION = @cdepreciacion');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientDepreciationsDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARDEPRECIACIONXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createRelationshipsFromClientQuery: async(clientData, relationships, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < depreciations.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('cparentesco', sql.Int, relationships[i].cparentesco)
            .input('xobservacion', sql.NVarChar, relationships[i].xobservacion)
            .input('fefectiva', sql.DateTime, depreciations[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPARENTESCO (CCLIENTE, CPARENTESCO, XOBSERVACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cparentesco, @xobservacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createRelationshipsFromClientUpdateQuery: async(clientData, createRelationshipsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createRelationshipsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('cparentesco', sql.Int, createRelationshipsList[i].cparentesco)
            .input('xobservacion', sql.NVarChar, createRelationshipsList[i].xobservacion)
            .input('fefectiva', sql.DateTime, createRelationshipsList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPARENTESCO (CCLIENTE, CPARENTESCO, XOBSERVACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cparentesco, @xobservacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateRelationshipByClientUpdateQuery: async(clientData, updateRelationshipsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateRelationshipsList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cparentesco', sql.Int, updateRelationshipsList[i].cparentesco)
                .input('xobservacion', sql.NVarChar, updateRelationshipsList[i].xobservacion)
                .input('fefectiva', sql.DateTime, updateRelationshipsList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLPARENTESCO set XOBSERVACION = @xobservacion, FEFECTIVA = @fefectiva, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CPARENTESCO = @cparentesco');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientRelationshipDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARPARENTESCOXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createPenaltiesFromClientQuery: async(clientData, penalties, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < penalties.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('cpenalizacion', sql.Int, penalties[i].cpenalizacion)
            .input('ppenalizacion', sql.Int, penalties[i].ppenalizacion)
            .input('mpenalizacion', sql.Numeric(11, 2), penalties[i].mpenalizacion)
            .input('fefectiva', sql.DateTime, penalties[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPENALIZACION (CCLIENTE, CPENALIZACION, PPENALIZACION, MPENALIZACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cpenalizacion, @ppenalizacion, @mpenalizacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createPenaltiesFromClientUpdateQuery: async(clientData, createPenaltiesList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createPenaltiesList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('cpenalizacion', sql.Int, createPenaltiesList[i].cpenalizacion)
            .input('ppenalizacion', sql.Int, createPenaltiesList[i].ppenalizacion)
            .input('mpenalizacion', sql.Numeric(11, 2), createPenaltiesList[i].mpenalizacion)
            .input('fefectiva', sql.DateTime, createPenaltiesList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPENALIZACION (CCLIENTE, CPENALIZACION, PPENALIZACION, MPENALIZACION, FEFECTIVA, CUSUARIOCREACION, FCREACION) values (@ccliente, @cpenalizacion, @ppenalizacion, @mpenalizacion, @fefectiva, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updatePenaltiesByClientUpdateQuery: async(clientData, updatePenaltiesList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updatePenaltiesList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cpenalizacion', sql.Int, updatePenaltiesList[i].cpenalizacion)
                .input('ppenalizacion', sql.Int, updatePenaltiesList[i].ppenalizacion)
                .input('mpenalizacion', sql.Numeric(11, 2), updatePenaltiesList[i].mpenalizacion)
                .input('fefectiva', sql.DateTime, updatePenaltiesList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLPENALIZACION set PPENALIZACION = @ppenalizacion, MPENALIZACION = @mpenalizacion, FEFECTIVA = @fefectiva, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CPENALIZACION = @cpenalizacion');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientPenaltiesDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARPENALIZACIONXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getClientAssociatesDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWASOCIADOSXCLIENTE where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createProvidersFromClientQuery: async(clientData, providers, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < providers.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('cproveedor', sql.Int, providers[i].cproveedor)
            .input('xobservacion', sql.NVarChar, providers[i].xobservacion)
            .input('fefectiva', sql.DateTime, providers[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPROVEEDOREXCLUIDO (CCLIENTE, CPROVEEDOR, FEFECTIVA, XOBSERVACION, CUSUARIOCREACION, FCREACION) values (@ccliente, @cproveedor, @fefectiva, @xobservacion, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createProvidersFromClientUpdateQuery: async(clientData, createProvidersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createProvidersList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('cproveedor', sql.Int, createProvidersList[i].cproveedor)
            .input('xobservacion', sql.NVarChar, createProvidersList[i].xobservacion)
            .input('fefectiva', sql.DateTime, createProvidersList[i].fefectiva)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPROVEEDOREXCLUIDO (CCLIENTE, CPROVEEDOR, FEFECTIVA, XOBSERVACION, CUSUARIOCREACION, FCREACION) values (@ccliente, @cproveedor, @fefectiva, @xobservacion, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateProvidersByClientUpdateQuery: async(clientData, updateProvidersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateProvidersList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cproveedor', sql.Int, updateProvidersList[i].cproveedor)
                .input('xobservacion', sql.NVarChar, updateProvidersList[i].xobservacion)
                .input('fefectiva', sql.DateTime, updateProvidersList[i].fefectiva)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLPROVEEDOREXCLUIDO set FEFECTIVA = @fefectiva, XOBSERVACION = @xobservacion, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CPROVEEDOR = @cproveedor');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientProvidersDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARPROVEEDOREXCLUIDOXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createModelsFromClientQuery: async(clientData, models, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < models.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('cmarca', sql.Int, models[i].cmarca)
            .input('cmodelo', sql.Int, models[i].cmodelo)
            .input('xobservacion', sql.NVarChar, models[i].xobservacion)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLMODELOEXCLUIDO (CCLIENTE, CMARCA, CMODELO, XOBSERVACION, CUSUARIOCREACION, FCREACION) values (@ccliente, @cmarca, @cmarca, @xobservacion, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createModelsFromClientUpdateQuery: async(clientData, createModelsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createModelsList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('cmarca', sql.Int, createModelsList[i].cmarca)
            .input('cmodelo', sql.Int, createModelsList[i].cmodelo)
            .input('xobservacion', sql.NVarChar, createModelsList[i].xobservacion)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLMODELOEXCLUIDO (CCLIENTE, CMARCA, CMODELO, XOBSERVACION, CUSUARIOCREACION, FCREACION) values (@ccliente, @cmarca, @cmodelo, @xobservacion, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateModelsByClientUpdateQuery: async(clientData, updateModelsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateModelsList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cmarca', sql.Int, updateModelsList[i].cmarca)
                .input('cmodelo', sql.Int, updateModelsList[i].cmodelo)
                .input('xobservacion', sql.NVarChar, updateModelsList[i].xobservacion)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLMODELOEXCLUIDO set XOBSERVACION = @xobservacion, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente AND CMARCA = @cmarca AND CMODELO = @cmodelo');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientModelsDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARMODELOEXCLUIDOXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createWorkersFromClientQuery: async(clientData, workers, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < workers.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('xnombre', sql.NVarChar, workers[i].xnombre)
            .input('xapellido', sql.NVarChar, workers[i].xapellido)
            .input('ctipodocidentidad', sql.Int,  workers[i].ctipodocidentidad)
            .input('xdocidentidad', sql.NVarChar, workers[i].xdocidentidad)
            .input('xtelefonocelular', sql.NVarChar, workers[i].xtelefonocelular)
            .input('xemail', sql.NVarChar, workers[i].xemail)
            .input('xprofesion', sql.NVarChar, workers[i].xprofesion ? workers[i].xprofesion : null)
            .input('xocupacion', sql.NVarChar, workers[i].xocupacion ? workers[i].xocupacion : null)
            .input('xtelefonocasa', sql.NVarChar, workers[i].xtelefonocasa ? workers[i].xtelefonocasa : null)
            .input('xfax', sql.NVarChar, workers[i].xfax ? workers[i].xfax : null)
            .input('cparentesco', sql.Int, workers[i].cparentesco)
            .input('cestadocivil', sql.Int, workers[i].cestadocivil)
            .input('fnacimiento', sql.DateTime, workers[i].fnacimiento)
            .input('xdireccion', sql.NVarChar, workers[i].xdireccion)
            .input('cestado', sql.Int, workers[i].cestado)
            .input('cciudad', sql.Int, workers[i].cciudad)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLTRABAJADOR (CCLIENTE, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XPROFESION, XOCUPACION, XTELEFONOCASA, XFAX, CPARENTESCO, CESTADOCIVIL, FNACIMIENTO, XDIRECCION, CESTADO, CCIUDAD, CUSUARIOCREACION, FCREACION) values (@ccliente, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xprofesion, @xocupacion, @xtelefonocasa, @xfax, @cparentesco, @cestadocivil, @fnacimiento, @xdireccion, @cestado, @cciudad, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createWorkersFromClientUpdateQuery: async(clientData, createWorkersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createWorkersList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('xnombre', sql.NVarChar, createWorkersList[i].xnombre)
            .input('xapellido', sql.NVarChar, createWorkersList[i].xapellido)
            .input('ctipodocidentidad', sql.Int,  createWorkersList[i].ctipodocidentidad)
            .input('xdocidentidad', sql.NVarChar, createWorkersList[i].xdocidentidad)
            .input('xtelefonocelular', sql.NVarChar, createWorkersList[i].xtelefonocelular)
            .input('xemail', sql.NVarChar, createWorkersList[i].xemail)
            .input('xprofesion', sql.NVarChar, createWorkersList[i].xprofesion ? createWorkersList[i].xprofesion : null)
            .input('xocupacion', sql.NVarChar, createWorkersList[i].xocupacion ? createWorkersList[i].xocupacion : null)
            .input('xtelefonocasa', sql.NVarChar, createWorkersList[i].xtelefonocasa ? createWorkersList[i].xtelefonocasa : null)
            .input('xfax', sql.NVarChar, createWorkersList[i].xfax ? createWorkersList[i].xfax : null)
            .input('cparentesco', sql.Int, createWorkersList[i].cparentesco)
            .input('cestadocivil', sql.Int, createWorkersList[i].cestadocivil)
            .input('fnacimiento', sql.DateTime, createWorkersList[i].fnacimiento)
            .input('xdireccion', sql.NVarChar, createWorkersList[i].xdireccion)
            .input('cestado', sql.Int, createWorkersList[i].cestado)
            .input('cciudad', sql.Int, createWorkersList[i].cciudad)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLTRABAJADOR (CCLIENTE, XNOMBRE, XAPELLIDO, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XPROFESION, XOCUPACION, XTELEFONOCASA, XFAX, CPARENTESCO, CESTADOCIVIL, FNACIMIENTO, XDIRECCION, CESTADO, CCIUDAD, CUSUARIOCREACION, FCREACION) values (@ccliente, @xnombre, @xapellido, @ctipodocidentidad, @xdocidentidad, @xtelefonocelular, @xemail, @xprofesion, @xocupacion, @xtelefonocasa, @xfax, @cparentesco, @cestadocivil, @fnacimiento, @xdireccion, @cestado, @cciudad, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateWorkersByClientUpdateQuery: async(clientData, updateWorkersList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateWorkersList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('ctrabajador', sql.Int, updateWorkersList[i].ctrabajador)
                .input('xnombre', sql.NVarChar, updateWorkersList[i].xnombre)
                .input('xapellido', sql.NVarChar, updateWorkersList[i].xapellido)
                .input('ctipodocidentidad', sql.Int,  updateWorkersList[i].ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, updateWorkersList[i].xdocidentidad)
                .input('xtelefonocelular', sql.NVarChar, updateWorkersList[i].xtelefonocelular)
                .input('xemail', sql.NVarChar, updateWorkersList[i].xemail)
                .input('xprofesion', sql.NVarChar, updateWorkersList[i].xprofesion ? updateWorkersList[i].xprofesion : null)
                .input('xocupacion', sql.NVarChar, updateWorkersList[i].xocupacion ? updateWorkersList[i].xocupacion : null)
                .input('xtelefonocasa', sql.NVarChar, updateWorkersList[i].xtelefonocasa ? updateWorkersList[i].xtelefonocasa : null)
                .input('xfax', sql.NVarChar, updateWorkersList[i].xfax ? updateWorkersList[i].xfax : null)
                .input('cparentesco', sql.Int, updateWorkersList[i].cparentesco)
                .input('cestadocivil', sql.Int, updateWorkersList[i].cestadocivil)
                .input('fnacimiento', sql.DateTime, updateWorkersList[i].fnacimiento)
                .input('xdireccion', sql.NVarChar, updateWorkersList[i].xdireccion)
                .input('cestado', sql.Int, updateWorkersList[i].cestado)
                .input('cciudad', sql.Int, updateWorkersList[i].cciudad)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLTRABAJADOR set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, XTELEFONOCELULAR = @xtelefonocelular, XEMAIL = @xemail, XPROFESION = @xprofesion, XOCUPACION = @xocupacion, XTELEFONOCASA = @xtelefonocasa, XFAX = @xfax, CPARENTESCO = @cparentesco, CESTADOCIVIL = @cestadocivil, FNACIMIENTO = @fnacimiento, XDIRECCION = @xdireccion, CESTADO = @cestado, CCIUDAD = @cciudad, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CTRABAJADOR = @ctrabajador and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientWorkersDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from CLTRABAJADOR where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createGroupersByClientQuery: async(clientData, createGroupersList, createGroupersBanksList, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createGroupersList.length; i++){
            let insert = await pool.request()
                .input('ccliente', sql.Int, ccliente)
                .input('xcontratoalternativo', sql.NVarChar, createGroupersList[i].xcontratoalternativo)
                .input('xnombre', sql.NVarChar, createGroupersList[i].xnombre)
                .input('xrazonsocial', sql.NVarChar, createGroupersList[i].xrazonsocial)
                .input('cestado', sql.Int, createGroupersList[i].cestado)
                .input('cciudad', sql.Int, createGroupersList[i].cciudad)
                .input('xdireccionfiscal', sql.NVarChar, createGroupersList[i].xdireccionfiscal)
                .input('ctipodocidentidad', sql.Int, createGroupersList[i].ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, createGroupersList[i].xdocidentidad)
                .input('bfacturar', sql.Bit, createGroupersList[i].bfacturar)
                .input('bcontribuyente', sql.Bit, createGroupersList[i].bcontribuyente)
                .input('bimpuesto', sql.Bit, createGroupersList[i].bimpuesto)
                .input('xtelefono', sql.NVarChar, createGroupersList[i].xtelefono)
                .input('xfax', sql.NVarChar, createGroupersList[i].xfax ? createGroupersList[i].xfax : null)
                .input('xemail', sql.NVarChar, createGroupersList[i].xemail)
                .input('xrutaimagen', sql.NVarChar, createGroupersList[i].xrutaimagen ? createGroupersList[i].xrutaimagen : null)
                .input('bactivo', sql.Bit, createGroupersList[i].bactivo)
                .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLAGRUPADOR (CCLIENTE, XCONTRATOALTERNATIVO, XNOMBRE, XRAZONSOCIAL, CESTADO, CCIUDAD, XDIRECCIONFISCAL, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, BFACTURAR, BCONTRIBUYENTE, BIMPUESTO, XTELEFONO, XFAX, XEMAIL, XRUTAIMAGEN, BACTIVO, CUSUARIOCREACION, FCREACION) output inserted.CAGRUPADOR values (@ccliente, @xcontratoalternativo, @xnombre, @xrazonsocial, @cestado, @cciudad, @xdireccionfiscal, @ctipodocidentidad, @xdocidentidad, @bfacturar, @bcontribuyente, @bimpuesto, @xtelefono, @xfax, @xemail, @xrutaimagen, @bactivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
            if(insert.rowsAffected > 0 && createGroupersBanksList){
                for(let j = 0; j < createGroupersBanksList.length; j++){
                    let subInsert = await pool.request()
                        .input('cagrupador', sql.Int, insert.recordset[0].CAGRUPADOR)
                        .input('cbanco', sql.Int, createGroupersBanksList[j].cbanco)
                        .input('ctipocuentabancaria', sql.Int, createGroupersBanksList[j].ctipocuentabancaria)
                        .input('xnumerocuenta', sql.NVarChar, createGroupersBanksList[j].xnumerocuenta)
                        .input('xcontrato', sql.NVarChar, createGroupersBanksList[j].xcontrato)
                        .input('bprincipal', sql.Bit, createGroupersBanksList[j].bprincipal)
                        .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                        .input('fcreacion', sql.DateTime, new Date())
                        .query('insert into CLBANCOAGRUPADOR (CAGRUPADOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, XCONTRATO, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@cagrupador, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @xcontrato, @bprincipal, @cusuariocreacion, @fcreacion)')
                }
            }
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createGroupersByClientUpdateQuery: async(clientData, createGroupersList, createGroupersBanksList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createGroupersList.length; i++){
            let insert = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('xcontratoalternativo', sql.NVarChar, createGroupersList[i].xcontratoalternativo)
                .input('xnombre', sql.NVarChar, createGroupersList[i].xnombre)
                .input('xrazonsocial', sql.NVarChar, createGroupersList[i].xrazonsocial)
                .input('cestado', sql.Int, createGroupersList[i].cestado)
                .input('cciudad', sql.Int, createGroupersList[i].cciudad)
                .input('xdireccionfiscal', sql.NVarChar, createGroupersList[i].xdireccionfiscal)
                .input('ctipodocidentidad', sql.Int, createGroupersList[i].ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, createGroupersList[i].xdocidentidad)
                .input('bfacturar', sql.Bit, createGroupersList[i].bfacturar)
                .input('bcontribuyente', sql.Bit, createGroupersList[i].bcontribuyente)
                .input('bimpuesto', sql.Bit, createGroupersList[i].bimpuesto)
                .input('xtelefono', sql.NVarChar, createGroupersList[i].xtelefono)
                .input('xfax', sql.NVarChar, createGroupersList[i].xfax ? createGroupersList[i].xfax : null)
                .input('xemail', sql.NVarChar, createGroupersList[i].xemail)
                .input('xrutaimagen', sql.NVarChar, createGroupersList[i].xrutaimagen ? createGroupersList[i].xrutaimagen : null)
                .input('bactivo', sql.Bit, createGroupersList[i].bactivo)
                .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLAGRUPADOR (CCLIENTE, XCONTRATOALTERNATIVO, XNOMBRE, XRAZONSOCIAL, CESTADO, CCIUDAD, XDIRECCIONFISCAL, CTIPODOCIDENTIDAD, XDOCIDENTIDAD, BFACTURAR, BCONTRIBUYENTE, BIMPUESTO, XTELEFONO, XFAX, XEMAIL, XRUTAIMAGEN, BACTIVO, CUSUARIOCREACION, FCREACION) output inserted.CAGRUPADOR values (@ccliente, @xcontratoalternativo, @xnombre, @xrazonsocial, @cestado, @cciudad, @xdireccionfiscal, @ctipodocidentidad, @xdocidentidad, @bfacturar, @bcontribuyente, @bimpuesto, @xtelefono, @xfax, @xemail, @xrutaimagen, @bactivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
            if(insert.rowsAffected > 0 && createGroupersBanksList){
                for(let j = 0; j < createGroupersBanksList.length; j++){
                    let subInsert = await pool.request()
                        .input('cagrupador', sql.Int, insert.recordset[0].CAGRUPADOR)
                        .input('cbanco', sql.Int, createGroupersBanksList[j].cbanco)
                        .input('ctipocuentabancaria', sql.Int, createGroupersBanksList[j].ctipocuentabancaria)
                        .input('xnumerocuenta', sql.NVarChar, createGroupersBanksList[j].xnumerocuenta)
                        .input('xcontrato', sql.NVarChar, createGroupersBanksList[j].xcontrato)
                        .input('bprincipal', sql.Bit, createGroupersBanksList[j].bprincipal)
                        .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                        .input('fcreacion', sql.DateTime, new Date())
                        .query('insert into CLBANCOAGRUPADOR (CAGRUPADOR, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, XCONTRATO, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@cagrupador, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @xcontrato, @bprincipal, @cusuariocreacion, @fcreacion)')
                }
            }
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateGroupersByClientUpdateQuery: async(clientData, updateGroupersList, updateGroupersBanksList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateGroupersList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cagrupador', sql.Int, updateGroupersList[i].cagrupador)
                .input('xcontratoalternativo', sql.NVarChar, updateGroupersList[i].xcontratoalternativo)
                .input('xnombre', sql.NVarChar, updateGroupersList[i].xnombre)
                .input('xrazonsocial', sql.NVarChar, updateGroupersList[i].xrazonsocial)
                .input('cestado', sql.Int, updateGroupersList[i].cestado)
                .input('cciudad', sql.Int, updateGroupersList[i].cciudad)
                .input('xdireccionfiscal', sql.NVarChar, updateGroupersList[i].xdireccionfiscal)
                .input('ctipodocidentidad', sql.Int, updateGroupersList[i].ctipodocidentidad)
                .input('xdocidentidad', sql.NVarChar, updateGroupersList[i].xdocidentidad)
                .input('bfacturar', sql.Bit, updateGroupersList[i].bfacturar)
                .input('bcontribuyente', sql.Bit, updateGroupersList[i].bcontribuyente)
                .input('bimpuesto', sql.Bit, updateGroupersList[i].bimpuesto)
                .input('xtelefono', sql.NVarChar, updateGroupersList[i].xtelefono)
                .input('xfax', sql.NVarChar, updateGroupersList[i].xfax ? updateGroupersList[i].xfax : null)
                .input('xemail', sql.NVarChar, updateGroupersList[i].xemail)
                .input('xrutaimagen', sql.NVarChar, updateGroupersList[i].xrutaimagen ? updateGroupersList[i].xrutaimagen : null)
                .input('bactivo', sql.Bit, updateGroupersList[i].bactivo)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLAGRUPADOR set XCONTRATOALTERNATIVO = @xcontratoalternativo, XNOMBRE = @xnombre, XRAZONSOCIAL = @xrazonsocial, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCIONFISCAL = @xdireccionfiscal, CTIPODOCIDENTIDAD = @ctipodocidentidad, XDOCIDENTIDAD = @xdocidentidad, BFACTURAR = @bfacturar, BCONTRIBUYENTE = @bcontribuyente, BIMPUESTO = @bimpuesto, XTELEFONO = @xtelefono, XFAX = @xfax, XEMAIL = @xemail, XRUTAIMAGEN = @xrutaimagen, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CAGRUPADOR = @cagrupador and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
            if(updateGroupersBanksList){
                if(update.rowsAffected > 0 && updateGroupersBanksList){
                    for(let j = 0; j < updateGroupersBanksList.length; j++){
                        let subUpdate = await pool.request()
                            .input('cagrupador', sql.Int, updateGroupersList[i].cagrupador)
                            .input('cbanco', sql.Int, updateGroupersBanksList[j].cbanco)
                            .input('ctipocuentabancaria', sql.Int, updateGroupersBanksList[j].ctipocuentabancaria)
                            .input('xnumerocuenta', sql.NVarChar, updateGroupersBanksList[j].xnumerocuenta)
                            .input('xcontrato', sql.NVarChar, updateGroupersBanksList[j].xcontrato)
                            .input('bprincipal', sql.Bit, updateGroupersBanksList[j].bprincipal)
                            .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                            .input('fmodificacion', sql.DateTime, new Date())
                            .query('update CLBANCOAGRUPADOR set CTIPOCUENTABANCARIA = @ctipocuentabancaria, XNUMEROCUENTA = @xnumerocuenta, XCONTRATO = @xcontrato, BPRINCIPAL = @bprincipal, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CBANCO = @cbanco and CAGRUPADOR = @cagrupador');
                    }
                }
            }
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientGroupersDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from CLAGRUPADOR where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getGrouperBanksDataQuery: async(cagrupador) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cagrupador', sql.Int, cagrupador)
            .query('select * from VWBUSCARBANCOXAGRUPADORDATA where CAGRUPADOR = @cagrupador');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createPlansFromClientQuery: async(clientData, plans, ccliente) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < plans.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .input('casociado', sql.Int, plans[i].casociado)
            .input('ctipoplan', sql.Int, plans[i].ctipoplan)
            .input('cplan', sql.Int, plans[i].cplan)
            .input('fdesde', sql.DateTime, plans[i].fdesde)
            .input('fhasta', sql.DateTime, plans[i].fhasta)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPLAN (CCLIENTE, CASOCIADO, CTIPOPLAN, CPLAN, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@ccliente, @casociado, @ctipoplan, @cplan, @fdesde, @fhasta, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
createPlansFromClientUpdateQuery: async(clientData, createPlansList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createPlansList.length; i++){
            let insert = await pool.request()
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('casociado', sql.Int, createPlansList[i].casociado)
            .input('ctipoplan', sql.Int, createPlansList[i].ctipoplan)
            .input('cplan', sql.Int, createPlansList[i].cplan)
            .input('fdesde', sql.DateTime, createPlansList[i].fdesde)
            .input('fhasta', sql.DateTime, createPlansList[i].fhasta)
            .input('cusuariocreacion', sql.Int, clientData.cusuariocreacion)
            .input('fcreacion', sql.DateTime, new Date())
            .query('insert into CLPLAN (CCLIENTE, CASOCIADO, CTIPOPLAN, CPLAN, FDESDE, FHASTA, CUSUARIOCREACION, FCREACION) values (@ccliente, @casociado, @ctipoplan, @cplan, @fdesde, @fhasta, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updatePlansFromClientUpdateQuery: async(clientData, updatePlansList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updatePlansList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cplancliente', sql.Int, updatePlansList[i].cplancliente)
                .input('casociado', sql.Int, updatePlansList[i].casociado)
                .input('ctipoplan', sql.Int, updatePlansList[i].ctipoplan)
                .input('cplan', sql.Int, updatePlansList[i].cplan)
                .input('fdesde', sql.DateTime, updatePlansList[i].fdesde)
                .input('fhasta', sql.DateTime, updatePlansList[i].fhasta)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLPLAN set  CPLAN = @cplan, CASOCIADO = @casociado, CTIPOPLAN = @ctipoplan, FDESDE = @fdesde, FHASTA = @fhasta, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CPLANCLIENTE = @cplancliente and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
getClientPlansDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARPLANXCLIENTEDATA where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateClientQuery: async(clientData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), clientData.cpais)
            .input('ccompania', sql.Int, clientData.ccompania)
            .input('ccliente', sql.Int, clientData.ccliente)
            .input('xcliente', sql.NVarChar, clientData.xcliente)
            .input('xrepresentante', sql.NVarChar, clientData.xrepresentante)
            .input('icedula', sql.NVarChar, clientData.icedula)
            .input('xdocidentidad', sql.NVarChar, clientData.xdocidentidad)
            .input('cestado', sql.Int, clientData.cestado)
            .input('cciudad', sql.Int, clientData.cciudad)
            .input('xdireccionfiscal', sql.NVarChar, clientData.xdireccionfiscal)
            .input('xemail', sql.NVarChar, clientData.xemail)
            .input('finicio', sql.DateTime, clientData.finicio)
            .input('xtelefono', sql.NVarChar, clientData.xtelefono ? clientData.xtelefono : null)
            .input('xpaginaweb', sql.NVarChar, clientData.xpaginaweb ? clientData.xpaginaweb : null)
            .input('xrutaimagen', sql.NVarChar, clientData.xrutaimagen ? clientData.xrutaimagen : null)
            .input('bactivo', sql.Bit, clientData.bactivo)
            .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
            .input('fmodificacion', sql.DateTime, new Date())
            .query('update CLCLIENTE set XCLIENTE = @xcliente, XREPRESENTANTE = @xrepresentante, ICEDULA = @icedula, XDOCIDENTIDAD = @xdocidentidad, CESTADO = @cestado, CCIUDAD = @cciudad, XDIRECCIONFISCAL = @xdireccionfiscal, XEMAIL = @xemail, FINICIO = @finicio, XTELEFONO = @xtelefono, XPAGINAWEB = @xpaginaweb, XRUTAIMAGEN = @xrutaimagen, BACTIVO = @bactivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCLIENTE = @ccliente and CPAIS = @cpais and CCOMPANIA = @ccompania');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createBanksByClientUpdateQuery: async(clientData, createBankList ) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createBankList.length; i++){
            let insert = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cbanco', sql.Int, createBankList[i].cbanco)
                .input('ctipocuentabancaria', sql.Int, createBankList[i].ctipocuentabancaria)
                .input('xnumerocuenta', sql.NVarChar, createBankList[i].xnumerocuenta)
                .input('bprincipal', sql.Bit, createBankList[i].bprincipal)
                .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLBANCO (CCLIENTE, CBANCO, CTIPOCUENTABANCARIA, XNUMEROCUENTA, BPRINCIPAL, CUSUARIOCREACION, FCREACION) values (@ccliente, @cbanco, @ctipocuentabancaria, @xnumerocuenta, @bprincipal, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateBanksByClientUpdateQuery: async(clientData, updateBankList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateBankList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cbanco', sql.Int, updateBankList[i].cbanco)
                .input('ctipocuentabancaria', sql.Int, updateBankList[i].ctipocuentabancaria)
                .input('xnumerocuenta', sql.NVarChar, updateBankList[i].xnumerocuenta)
                .input('bprincipal', sql.Bit, updateBankList[i].bprincipal)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLBANCO set CTIPOCUENTABANCARIA = @ctipocuentabancaria, XNUMEROCUENTA = @xnumerocuenta, BPRINCIPAL = @bprincipal, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CBANCO = @cbanco and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createContactsByClientUpdateQuery: async(clientData, createContactsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createContactsList.length; i++){
            let insert = await pool.request()
                .input('xnombre', sql.NVarChar, createContactsList[i].xnombre)
                .input('xapellido', sql.NVarChar, createContactsList[i].xapellido)
                .input('icedula', sql.NVarChar, createContactsList[i].icedula)
                .input('xdocidentidad', sql.NVarChar, createContactsList[i].xdocidentidad)
                .input('xtelefonocelular', sql.NVarChar, createContactsList[i].xtelefonocelular)
                .input('xemail', sql.NVarChar, createContactsList[i].xemail)
                .input('xcargo', sql.NVarChar, createContactsList[i].xcargo)
                .input('xtelefonooficina', sql.NVarChar, createContactsList[i].xtelefonooficina)
                .input('xtelefonocasa', sql.NVarChar, createContactsList[i].xtelefonocasa)
                .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLCONTACTO (XNOMBRE, XAPELLIDO, ICEDULA, XDOCIDENTIDAD, XTELEFONOCELULAR, XEMAIL, XCARGO, XTELEFONOOFICINA, XTELEFONOCASA, CUSUARIOCREACION, FCREACION) values (@xnombre, @xapellido, @icedula, @xdocidentidad, @xtelefonocelular, @xemail, @xcargo, @xtelefonooficina, @xtelefonocasa, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateContactsByClientUpdateQuery: async(clientData, updateContactsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < updateContactsList.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('ccontacto', sql.Int, updateContactsList[i].ccontacto)
                .input('xnombre', sql.NVarChar, updateContactsList[i].xnombre)
                .input('xapellido', sql.NVarChar, updateContactsList[i].xapellido)
                .input('icedula', sql.NVarChar, updateContactsList[i].icedula)
                .input('xdocidentidad', sql.NVarChar, updateContactsList[i].xdocidentidad)
                .input('xtelefonocelular', sql.NVarChar, updateContactsList[i].xtelefonocelular)
                .input('xemail', sql.NVarChar, updateContactsList[i].xemail)
                .input('xcargo', sql.NVarChar, updateContactsList[i].xcargo)
                .input('xtelefonooficina', sql.NVarChar, updateContactsList[i].xtelefonooficina)
                .input('xtelefonocasa', sql.NVarChar, updateContactsList[i].xtelefonocasa)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLCONTACTO set XNOMBRE = @xnombre, XAPELLIDO = @xapellido, ICEDULA = @icedula, XDOCIDENTIDAD = @xdocidentidad, XTELEFONOCELULAR = @xtelefonocelular, XEMAIL = @xemail, XCARGO = @xcargo, XTELEFONOOFICINA = @xtelefonooficina, XTELEFONOCASA = @xtelefonocasa, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CCONTACTO = @ccontacto and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
createDocumentsByClientUpdateQuery: async(clientData, createDocumentsList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < createDocumentsList.length; i++){
            let insert = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('xrutaarchivo', sql.NVarChar, createDocumentsList[i].xrutaarchivo)
                .input('cusuariocreacion', sql.Int, clientData.cusuariomodificacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into CLDOCUMENTO (CCLIENTE, XRUTAARCHIVO, CUSUARIOCREACION, FCREACION) values (@ccliente, @xrutaarchivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateDocumentsByClientUpdateQuery: async(documents, clientData) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < documents.length; i++){
            let update = await pool.request()
                .input('ccliente', sql.Int, clientData.ccliente)
                .input('cdocumento', sql.Int, documents[i].cdocumento)
                .input('xrutaarchivo', sql.NVarChar, documents[i].xrutaarchivo)
                .input('cusuariomodificacion', sql.Int, clientData.cusuariomodificacion)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update CLDOCUMENTO set XRUTAARCHIVO = @xrutaarchivo, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion where CDOCUMENTO = @cdocumento and CCLIENTE = @ccliente');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchServiceTypeFromFleetContractQuery: async(ccontratoflota) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccontratoflota', sql.Int, ccontratoflota)
            .query('select * from VWBUSCARPLANXCONTRATO where CCONTRATOFLOTA = @ccontratoflota');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
storeProcedureFromServiceQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        for(let i = 0; i < data.service.length; i++){
            let result = await pool.request()
            .input('cplan', sql.Int, data.service[i].cplan)
            .input('ctiposervicio', sql.Int, data.service[i].ctiposervicio)
            .input('ccontratoflota', sql.Int, data.ccontratoflota)
            .input('cusuariocreacion', sql.Int, data.cusuariocreacion)
            .execute('PoBServicios');
        }
        let query= await pool.request()
        .input('ccontratoflota', sql.Int, data.ccontratoflota)
        .query('select * from SUSERVICIOS WHERE CCONTRATOFLOTA = @ccontratoflota');
        return { result: query };
    }catch(err){
        return { error: err.message };
        }
},
getServiceRequestDataQuery: async(serviceRequestData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('csolicitudservicio', sql.Int, serviceRequestData.csolicitudservicio)
            .query('select * from VWBUSCARSOLICITUDSERVICIODATA where CSOLICITUDSERVICIO = @csolicitudservicio');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceRequestTracingsDataQuery: async(csolicitudservicio) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('csolicitudservicio', sql.Int, csolicitudservicio)
            .query('select * from VWBUSCARSEGUIMIENTOXSOLICITUDSERVICIODATA where CSOLICITUDSERVICIO = @csolicitudservicio');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
storeProcedureFromClubQuery: async(data) => {
    try{
        let pool = await sql.connect(config);
        for(let i = 0; i < data.ctiposervicio.length; i++){
            let result = await pool.request()
            .input('cplan', sql.Int, data.cplan)
            .input('ctiposervicio', sql.Int, data.ctiposervicio[i].ctiposervicio)
            .input('ccontratoflota', sql.Int, data.ccontratoflota)
            .input('cusuariocreacion', sql.Int, data.cusuariocreacion)
            .execute('PoBServicios');
        }
        let query= await pool.request()
        .input('ccontratoflota', sql.Int, data.ccontratoflota)
        .query('select * from VWBUSCARSERVICIOSPARACLUB WHERE CCONTRATOFLOTA = @ccontratoflota');
        return { result: query };
    }catch(err){
        return { error: err.message };
        }
},
searchContractArysQuery: async(canal) => {
    try{
        let query = `select * from VWBUSCARCONTRATOSSERVICIOSARYS where CESTATUSGENERAL <> 22${ canal.ccanal ? ' and CCANAL = @ccanal' : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccanal', sql.Int, canal.ccanal)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getCompanyContractData: async() => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from macompania where ccompania = 1')
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getContractArysDataQuery: async(contractData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), contractData.cpais ? contractData.cpais: undefined)
            .input('ccompania', sql.Int, contractData.ccompania)
            .input('ccontratoflota', sql.Int, contractData.ccontratoflota)
            .query('select * from VWBUSCARSUCONTRATOFLOTADATA where CCONTRATOFLOTA = @ccontratoflota and CCOMPANIA = @ccompania');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getContractArysOwnerDataQuery: async(contractData, cpropietario) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cpais', sql.Numeric(4, 0), contractData.cpais)
            .input('ccompania', sql.Int, contractData.ccompania)
            .input('cpropietario', sql.Int, cpropietario)
            .query('select * from VWBUSCARPROPIETARIOXCONTRATOFLOTADATA where  CCOMPANIA = @ccompania and CPROPIETARIO = @cpropietario');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getContractClientDataQuery: async(ccliente) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccliente', sql.Int, ccliente)
            .query('select * from VWBUSCARCLIENTEXCONTRATOFLOTADATA where CCLIENTE = @ccliente');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getPlanData: async(cplan) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query('select * from POPLAN where CPLAN = @cplan');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceTypeFromPlanQuery: async(cplan) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query('select DISTINCT CTIPOSERVICIO, XTIPOSERVICIO, BACEPTADO from VWBUSCARSERVICIOSXPLAN where CPLAN = @cplan AND BACEPTADO = 1');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceFromPlanQuery: async(cplan) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query('select * from VWBUSCARSERVICIOSXPLAN where CPLAN = @cplan AND BACEPTADO = 1');
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getServiceFromPlanServiceQuery: async(ctiposervicio) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ctiposervicio', sql.Int, ctiposervicio)
            .query('select * from MASERVICIO where CTIPOSERVICIO = @ctiposervicio');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataPasswordQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT * FROM SECONFIG');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
dataCancellationQuery: async(data) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let update = await pool.request()
        .input('ccontratoflota', sql.Int, data.ccontratoflota)
        .input('ccausaanulacion', sql.Int, data.ccausaanulacion)
        .query('UPDATE SUCONTRATOFLOTA SET CCAUSAANULACION = @ccausaanulacion WHERE CCONTRATOFLOTA = @ccontratoflota');
        rowsAffected = rowsAffected + update.rowsAffected;
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
searchCodePlanRcvQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select MAX(CPLAN_RC) AS CPLAN_RC from POPLAN_RC');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createPlanCoverageRcvQuery: async(cplan_rc, planList, dataPlanRcv) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < planList.length; i++){
            let insert = await pool.request()
                .input('cplan_rc', sql.Int, cplan_rc)
                .input('xcobertura', sql.NVarChar, planList[i].xcobertura)
                .input('xsoat', sql.NVarChar, planList[i].xsoat)
                .input('bactivo', sql.Bit, 1)
                .input('cusuariocreacion', sql.Int, dataPlanRcv.cusuariocreacion)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into POPLAN_RC_DETALLE (CPLAN_RC, XCOBERTURA, XSOAT, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cplan_rc, @xcobertura, @xsoat, @bactivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchLastPlanRcvQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select MAX(CPLAN_RC) AS CPLAN_RC from POPLAN_RC');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
valrepPlanRcvQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('select * from POPLAN_RC');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createServiceTypeFromPlanRcvQuery: async(serviceTypeList, dataPlanRcv, cplan_rc) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < serviceTypeList.length; i++){
            let insert = await pool.request()
                .input('cplan_rc', sql.Int, cplan_rc)
                .input('ctiposervicio', sql.Int, serviceTypeList[i].ctiposervicio)
                .input('baceptado', sql.Bit, serviceTypeList[i].baceptado)
                .input('bactivo', sql.Bit, 1)
                .input('cusuariocreacion', sql.Int, dataPlanRcv.cusuario)
                .input('fcreacion', sql.DateTime, new Date())
                .query('insert into POTIPOSERVICIOS_RC (CPLAN_RC, CTIPOSERVICIO, BACEPTADO, BACTIVO, CUSUARIOCREACION, FCREACION) values (@cplan_rc, @ctiposervicio, @baceptado, @bactivo, @cusuariocreacion, @fcreacion)')
            rowsAffected = rowsAffected + insert.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
updateServiceFromQuantityRcvQuery: async(quantityList, cplan_rc) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < quantityList.length; i++){
            let update = await pool.request()
            .input('cplan_rc', sql.Int, cplan_rc)
            .input('baceptado', sql.Bit, quantityList[i].baceptado)
            .input('ncantidad', sql.Int, quantityList[i].ncantidad)
            .input('pservicio', sql.Numeric(5, 2), quantityList[i].pservicio)
            .input('mmaximocobertura', sql.Numeric(18, 2), quantityList[i].mmaximocobertura)
            .input('mdeducible', sql.Numeric(18, 2), quantityList[i].mdeducible)
            .input('cservicio', sql.Int, quantityList[i].cservicio)
            .query('UPDATE POSERVICIOS_RC SET NCANTIDAD = @ncantidad, PSERVICIO = @pservicio, MMAXIMOCOBERTURA = @mmaximocobertura, MDEDUCIBLE = @mdeducible, BACEPTADO = @baceptado WHERE CPLAN_RC = @cplan_rc AND CSERVICIO = @cservicio')
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        consoloe.log(err.message)
        return { error: err.message };
    }
},
getPlanRcvServicesDataQuery: async(cplan_rc) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan_rc', sql.Int, cplan_rc)
            .query('select * from VWBUSCARTIPOSERVICIOSXPLANRC where CPLAN_RC = @cplan_rc');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchQuoteRequestNotificationQuery: async(cproveedor, searchData) => {
    try{
        let query = `select * from EVCOTIZACIONNOTIFICACION where CPROVEEDOR = @cproveedor${ searchData.fcreacion ? " and datediff(day, FCREACION, @fcreacion) = 0" : '' }`;
        let pool = await sql.connect(config);
        for(let i = 0; i < cproveedor.length; i++){
            let result = await pool.request()
            .input('cproveedor', sql.Int, cproveedor[i].cproveedor)
            .input('fcreacion', sql.DateTime, searchData.fcreacion ? searchData.fcreacion : '01/01/2000')
            .query(query);
        //sql.close();
        return { result: result };
        }
    }catch(err){
        return { error: err.message };
    }
},
getQuoteRequestNotificationDataQuery: async(cproveedor, quoteRequestData) => {
    // try{
    //     let pool = await sql.connect(config);
    //     for(let i = 0; i < cproveedor.length; i++){
    //         let result = await pool.request()
    //             .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
    //             .input('cproveedor', sql.Int, cproveedor[i].cproveedor)
    //             .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CCOTIZACION = @ccotizacion and CPROVEEDOR = @cproveedor');
    //         //sql.close();
    //         
    //         return { result: result };
    //     }
    // }catch(err){
    //     return { error: err.message };
    // }
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccotizacion', sql.Int, quoteRequestData.ccotizacion)
            .input('cproveedor', sql.Int, cproveedor)
            .query('select * from VWBUSCARPROVEEDORXNOTIFICACIONDATA where CCOTIZACION = @ccotizacion and CPROVEEDOR = @cproveedor');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getReplacementsProviderNotificationDataQuery: async(ccotizacion) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccotizacion', sql.Int, ccotizacion)
            .query('select * from VWBUSCARREPUESTOXCOTIZACIONDATA where CCOTIZACION = @ccotizacion');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateQuoteRequestNotificationQuery: async(quotesProviders) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < quotesProviders.length; i++){
            let update = await pool.request()
            .input('cproveedor', sql.Int, quotesProviders[i].cproveedor)
            .input('ccotizacion', sql.Int, quotesProviders[i].ccotizacion)
            .input('mtotalcotizacion', sql.Numeric(11, 2), quotesProviders[i].mtotalcotizacion ? quotesProviders[i].mtotalcotizacion : null)
            .input('bcerrada', sql.Bit, quotesProviders[i].bcerrada)
            .input('cusuariomodificacion', sql.Int, quotesProviders[i].cusuariomodificacion)
            .input('baceptacion', sql.Bit, false)
            .input('cmoneda', sql.Int, quotesProviders[i].cmoneda)
            .input('fmodificacion', sql.DateTime, new Date())
            .query('update EVCOTIZACIONNOTIFICACION set MTOTALCOTIZACION = @mtotalcotizacion, BCERRADA = @bcerrada, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, BACEPTACION = @baceptacion, CMONEDA = @cmoneda where CCOTIZACION = @ccotizacion and CPROVEEDOR = @cproveedor');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }catch(err){
        return { error: err.message };
    }
},
updateReplacementsByQuoteRequestNotificationUpdateQuery: async(quotesProviders) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        for(let i = 0; i < quotesProviders.length; i++){
            let update = await pool.request()
                .input('ccotizacion', sql.Int, quotesProviders[i].ccotizacion)
                .input('crepuestocotizacion', sql.Int, quotesProviders[i].crepuestocotizacion)
                .input('bdisponible', sql.Bit, quotesProviders[i].bdisponible)
                .input('bdescuento', sql.Bit, quotesProviders[i].bdescuento)
                .input('munitariorepuesto', sql.Numeric(11, 2), quotesProviders[i].munitariorepuesto ? quotesProviders[i].munitariorepuesto : null)
                .input('mtotalrepuesto', sql.Numeric(11, 2), quotesProviders[i].mtotalrepuesto ? quotesProviders[i].mtotalrepuesto : null)
                .input('cusuariomodificacion', sql.Int, quotesProviders[i].cusuariomodificacion)
                .input('cmoneda', sql.Int, quotesProviders[i].cmoneda)
                .input('fmodificacion', sql.DateTime, new Date())
                .query('update EVREPUESTOCOTIZACION set BDISPONIBLE = @bdisponible, BDESCUENTO = @bdescuento, MUNITARIOREPUESTO = @munitariorepuesto, MTOTALREPUESTO = @mtotalrepuesto, CUSUARIOMODIFICACION = @cusuariomodificacion, FMODIFICACION = @fmodificacion, CMONEDA = @cmoneda where CREPUESTOCOTIZACION = @crepuestocotizacion and CCOTIZACION = @ccotizacion');
            rowsAffected = rowsAffected + update.rowsAffected;
        }
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchContractQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('fdesde', sql.DateTime, searchData.fdesde)
            .input('fhasta', sql.DateTime, searchData.fhasta)
            .query(`SELECT * FROM VWBUSCARCONTRATOSXRENOVACIONES WHERE FHASTA_POL >= @fdesde AND FHASTA_POL <= @fhasta AND CESTATUSGENERAL <> 22`);
        //sql.close();
        
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
createRenovationQuery: async(renovationList) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        
        let insert = await pool.request()
            .input('ccarga', sql.Int, renovationList.ccarga)
            .input('cplan', sql.Int, renovationList.cplan)
            .input('cplan_rc', sql.Int, renovationList.cplan_rc)
            .input('xplaca', sql.NVarChar, renovationList.xplaca)
            .input('cusuariocreacion', sql.Int, renovationList.cusuariocreacion)
            .query('insert into TMRENOVACION (CPLAN, CPLAN_RC, CCARGA, XPLACA, CUSUARIOCREACION) values (@cplan, @cplan_rc, @ccarga, @xplaca, @cusuariocreacion)')
        rowsAffected = rowsAffected + insert.rowsAffected;
        
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchPlanServiceQuery: async(cplan) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, cplan)
            .query('select * from POSERVICIOS where CPLAN = @cplan AND BACEPTADO IS NULL');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateAceptepServiceQuery: async(baceptado, cplan) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let update = await pool.request()
            .input('cplan', sql.Int, cplan)
            .input('baceptado', sql.Bit, baceptado)
            .query('UPDATE POSERVICIOS SET BACEPTADO = @baceptado WHERE CPLAN = @cplan AND BACEPTADO IS NULL')
        rowsAffected = rowsAffected + update.rowsAffected;
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){
        return { error: err.message };
    }
},
searchTypeServicePlanQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, searchData.cplan)
            .input('baceptado', sql.Bit, searchData.baceptado)
            .query(`select * from VWBUSCARTIPOSERVICIOSXPLAN where CPLAN = @cplan AND BACEPTADO = @baceptado`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchServicePlanQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, searchData.cplan)
            .input('baceptado', sql.Bit, searchData.baceptado)
            .query(`select * from VWBUSCARSERVICIOSXPLAN where CPLAN = @cplan AND BACEPTADO = @baceptado`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchQuantityPlanQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan', sql.Int, searchData.cplan)
            .input('cservicio', sql.Int, searchData.cservicio)
            .query(`select * from POSERVICIOS where CPLAN = @cplan AND CSERVICIO = @cservicio`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchTypeServicePlanRcvQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan_rc', sql.Int, searchData.cplan_rc)
            .input('baceptado', sql.Bit, searchData.baceptado)
            .query(`select * from VWBUSCARTIPOSERVICIOSXPLANRC where CPLAN_RC = @cplan_rc AND BACEPTADO = @baceptado`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchServicePlanRcvQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan_rc', sql.Int, searchData.cplan_rc)
            .input('baceptado', sql.Bit, searchData.baceptado)
            .query(`select * from VWBUSCARSERVICIOSXPLANRC where CPLAN_RC = @cplan_rc AND BACEPTADO = @baceptado`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchQuantityPlanRcvQuery: async(searchData) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan_rc', sql.Int, searchData.cplan_rc)
            .input('cservicio', sql.Int, searchData.cservicio)
            .query(`select * from POSERVICIOS_RC where CPLAN_RC = @cplan_rc AND CSERVICIO = @cservicio`);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
searchPlanRcvServiceQuery: async(cplan_rc) => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('cplan_rc', sql.Int, cplan_rc)
            .query('select * from POSERVICIOS_RC where CPLAN_RC = @cplan_rc AND BACEPTADO IS NULL');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
updateAceptepServiceRcvQuery: async(baceptado, cplan_rc) => {
    try{
        let rowsAffected = 0;
        let pool = await sql.connect(config);
        let update = await pool.request()
            .input('cplan_rc', sql.Int, cplan_rc)
            .input('baceptado', sql.Bit, baceptado)
            .query('UPDATE POSERVICIOS_RC SET BACEPTADO = @baceptado WHERE CPLAN_RC = @cplan_rc AND BACEPTADO IS NULL')
        rowsAffected = rowsAffected + update.rowsAffected;
        //sql.close();
        return { result: { rowsAffected: rowsAffected } };
    }
    catch(err){  
        return { error: err.message };
    }
},
getContractSendEmailDataQuery: async() => {
    try{
        let pool = await sql.connect(config);
        let result = await pool.request()
            .query('SELECT * FROM SuvMembresia WHERE IENVIOS = 0 OR IENVIOS IS NULL');
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
getSearchTracingData: async (dataTracing) => {
    try {
      let query = "";
      let pool = await sql.connect(config);
      let result;
  
        query = `SELECT * FROM VWBUSCARSEGUIMIENTOXNOTIFICACIONDATA`;
        result = await pool.request().query(query);

      return { result: result };
    } catch (err) {
      return { error: err.message };
    }
  },
salesPipelineValrepQuery: async(data) => {
    try{
        let query = `select * from MACANALVENTA where BACTIVO = 1${ data.ccanal ? ' and CCANAL = @ccanal' : '' }`;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('ccanal', sql.Int, data.ccanal)
            .query(query);
        //sql.close();
        return { result: result };
    }catch(err){
        return { error: err.message };
    }
},
}

